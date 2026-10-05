import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { TsActorHost } from '../state/ts-actor-host'
import { locateLayer } from '../state/mutations/helpers'
import type { EditingTranscript, TranscriptRef, StichJob } from '../../shared/stich'
import { romanHindi } from '../../shared/romanHindi'

export interface StichServiceDeps {
  host(): TsActorHost | null
  workspace(): string | null
  invoke(channel: string, args: Record<string, unknown>): Promise<unknown>
  transcribe(layerId: string, language?: string): Promise<unknown>
  startExport(job: StichJob, outputPath: string, resolutionHeight: number | null): void
  emit(event: string, payload: unknown): void
}
export function createStichService(deps: StichServiceDeps) {
  const previewReplies=new Map<string,(state:unknown)=>void>()
  const jobs=new Map<string,StichJob>(); let revision=0; let epoch=randomUUID()
  const outputs=new Map<string,{target:string;staged:string}>();const cancelRequested=new Set<string>()
  const receipts=new Map<string,{signature:string; result:unknown}>()
  const host=()=>{const h=deps.host(); if(!h?.openedProject()) throw new Error('Open or create a Stich project first');return h}
  let previousWorkspace=deps.workspace()
  deps.host()?.actor.subscribe(()=>{ revision++; const current=deps.workspace(); if(current!==previousWorkspace){previousWorkspace=current;epoch=randomUUID()} deps.emit('stich:changed',status()) })
  let receiptWorkspace:string|null=null
  const receiptFile=()=>path.join(deps.workspace()!,'Cache','Stich','receipts.json')
  const syncReceipts=()=>{const ws=deps.workspace();if(ws===receiptWorkspace)return;receiptWorkspace=ws;receipts.clear();if(ws&&fs.existsSync(receiptFile())){const rows=JSON.parse(fs.readFileSync(receiptFile(),'utf8'));for(const [id,v] of rows)receipts.set(id,v)}}
  const persistReceipts=()=>{const f=receiptFile();fs.mkdirSync(path.dirname(f),{recursive:true});while(receipts.size>100)receipts.delete(receipts.keys().next().value!);fs.writeFileSync(f+'.tmp',JSON.stringify([...receipts]));fs.renameSync(f+'.tmp',f)}
  const status=()=>({workspace:deps.workspace() ? epoch : null,revision,jobs:[...jobs.values()]})
  const guard=(a:Record<string,unknown>)=>{if(a.workspace!==epoch || a.revision!==revision)throw new Error('Stale project revision: read stich_status and retry with current word occurrences.')}
  const clip=(id:unknown)=>{if(typeof id!=='string')throw new Error('layerId is required'); const h=host(); const l=locateLayer(h.actor.snapshot(),id);if(!l || !['VideoClip','Audio'].includes(l.layer.params.kind))throw new Error('Select a video/audio clip'); const p=l.layer.params as {media:string;src_in_us:number;src_out_us:number;time_map?:{rate:{num:number;den:number}}};if(p.time_map && p.time_map.rate.num!==p.time_map.rate.den)throw new Error('Transcript edits currently require normal-speed footage'); return {h,...l,p}}
  const load=(id:unknown)=>{const c=clip(id);const ref=c.layer.metadata.stich_transcript as TranscriptRef|undefined;if(!ref || !/^[a-f0-9-]{36}$/.test(ref.id))throw new Error('Generate an editing transcript for this clip first');const doc=JSON.parse(fs.readFileSync(path.join(deps.workspace()!,'Transcripts',ref.id+'.json'),'utf8')) as EditingTranscript;if(doc.sourceHash!==host().actor.snapshot().media_pool[c.p.media]?.file_hash_blake3)throw new Error('Source media changed; regenerate the editing transcript');return {...c,ref,doc}}
  const read=(id:unknown)=>{const c=load(id);return {layerId:c.layer.id,transcriptId:c.doc.id,timing:c.doc.timing,...status(),words:c.doc.words.filter(w=>w.startUs>=c.p.src_in_us && w.endUs<=c.p.src_out_us).map(w=>({...w,display:c.ref.corrections[w.id]??w.roman,timelineStartUs:c.layer.t_start_us+w.startUs-c.p.src_in_us,timelineEndUs:c.layer.t_start_us+w.endUs-c.p.src_in_us}))}}
  const commitRef=(id:string,ref:TranscriptRef)=>{const r=host().actor.dispatch('stich_transcript_metadata',{layer:id,transcript:ref});if(!r.ok)throw new Error(JSON.stringify(r.error));return r.value}
  const update=(j:StichJob)=>{deps.emit('stich:job',j);deps.emit('stich:changed',status())}
  const begin=(kind:StichJob['kind'])=>{if([...jobs.values()].some(j=>j.state==='running'))throw new Error('A processing job is already running; finish or cancel it first');const j:StichJob={id:randomUUID(),kind,state:'running',stage:'starting',startedAt:Date.now()};jobs.set(j.id,j);update(j);return j}
  const finish=(j:StichJob,state:StichJob['state'],result?:unknown,error?:string)=>{j.state=state;j.stage=state;j.elapsedMs=Date.now()-j.startedAt;if(j.kind==='export')deps.host()?.actor.setEditingBlocked(false);if(result!==undefined)j.result=result;if(error)j.error=error;update(j)}
  async function exportUpdate(id:string,state:Record<string,unknown>) {
    const j=jobs.get(id);if(!j || j.state!=='running')return
    const kind=String(state.kind??'rendering');j.stage=kind
    if(kind==='complete') {
      try {
        const output=outputs.get(id)!;const {stdout}=await promisify(execFile)('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output.staged],{maxBuffer:1024*1024})
        const probe=JSON.parse(stdout);if(!probe.streams.some((s:{codec_type:string})=>s.codec_type==='video') || !(Number(probe.format.duration)>0))throw new Error('Export verification found no usable video')
        if(cancelRequested.has(id)){fs.rmSync(output.staged,{force:true});finish(j,'cancelled');return}
        fs.linkSync(output.staged,output.target);fs.unlinkSync(output.staged)
        finish(j,'complete',{...(state.payload as Record<string,unknown>),outputPath:output.target,verification:{metadata:true,playback:false}})
      } catch(e) {finish(j,'error',undefined,String(e))}
    } else if(kind==='error')finish(j,'error',undefined,String(state.detail))
    else if(kind==='cancelled')finish(j,'cancelled')
    else update(j)
  }

  async function run(name:string,a:Record<string,unknown>={}) : Promise<unknown> {
    if(name==='stich_status')return status()
    if(name==='stich_save_project'){await deps.invoke('project_save',{});return {saved:true,...status()}}
    if(name==='stich_setup_local_speech'){await deps.invoke('models_use',{id:'whisper-base'});return {accepted:true,model:'whisper-base',local:true}}
    if(name==='stich_preview_update'){const reply=previewReplies.get(String(a.requestId));if(reply){previewReplies.delete(String(a.requestId));reply(a.state)}return null}
    if(name==='stich_preview'){
      if(!['play','pause','seek'].includes(String(a.action)))throw new Error('Use play, pause or seek')
      if(a.action==='seek' && (typeof a.timeUs!=='number'||a.timeUs<0))throw new Error('timeUs must be a non-negative integer')
      const id=randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{previewReplies.delete(id);reject(new Error('No live editor acknowledged playback; open the editor first.'))},5000);previewReplies.set(id,state=>{clearTimeout(timer);resolve(state)});deps.emit('stich:preview-request',{...a,requestId:id,target:a.target??'browser'})})
    }
    if(name==='stich_find_files'){
      if(typeof a.root!=='string'||!path.isAbsolute(a.root))throw new Error('Specify an absolute folder root')
      return fs.readdirSync(a.root,{withFileTypes:true}).filter(d=>d.isFile()&&/\.(mp4|mov|mkv|webm|m4v|wav|mp3|m4a)$/i.test(d.name)).slice(0,100).map(d=>({name:d.name,path:path.join(String(a.root),d.name)}))
    }
    if(name==='stich_move_project'){
      const h=host();if(h.actor.isEditingBlocked()||[...jobs.values()].some(j=>j.state==='running'))throw new Error('Wait for processing jobs before moving this project')
      const from=deps.workspace()!;if(typeof a.path!=='string'||!path.isAbsolute(a.path)||fs.existsSync(a.path))throw new Error('Choose a new absolute project folder path')
      if(a.path.startsWith(from+path.sep))throw new Error('Destination cannot be inside the current project')
      await deps.invoke('project_save',{});await deps.invoke('project_close',{})
      let copied=false
      try {try {fs.renameSync(from,a.path)}catch(e){if((e as NodeJS.ErrnoException).code!=='EXDEV')throw e;fs.cpSync(from,a.path,{recursive:true,errorOnExist:true,force:false});copied=true}
        await h.projects.open(a.path)
        const missing=Object.values(h.actor.snapshot().media_pool).filter(m=>!fs.existsSync(m.path_abs));if(missing.length)throw new Error('Moved project has missing source media; original copy retained for recovery')
        return {path:a.path,originalRetained:copied,...status()}
      }catch(e){if(!copied&&fs.existsSync(a.path)&&!fs.existsSync(from))fs.renameSync(a.path,from);if(fs.existsSync(from))await h.projects.open(from);throw e}
    }

    if(name==='stich_read_transcript')return read(a.layerId)
    if(name==='stich_cancel_job') {
      const j=jobs.get(String(a.jobId));if(!j || j.state!=='running')throw new Error('Job is not running')
      if(j.kind==='export' && ['finalizing','verifying'].includes(j.stage))throw new Error('Export is finalizing; wait for its result')
      cancelRequested.add(j.id);j.stage=j.kind==='transcript'?'cancelling; local engine is finishing its current request':'cancelling';update(j)
      if(j.kind==='export')deps.emit('stich:cancel-export',{jobId:j.id})
      return j
    }

    if(name==='stich_transcribe') {
      const c=clip(a.layerId);const ws=deps.workspace()!;const source=host().actor.snapshot().media_pool[c.p.media]!;const originalBounds=JSON.stringify(c.p);const startEpoch=epoch;const j=begin('transcript');j.stage='recognizing locally';update(j)
      void (async()=>{try {
        const raw=await deps.transcribe(c.layer.id, ['en','hi'].includes(String(a.language)) ? String(a.language) : undefined) as {segments:Array<{words:Array<{text:string;t_start_us:number;t_end_us:number}>}>;word_timing:string;backend?:string}
        if(j.state!=='running')return
        if(cancelRequested.has(j.id)){finish(j,'cancelled');return}
        if(epoch!==startEpoch || JSON.stringify(clip(c.layer.id).p)!==originalBounds)throw new Error('Project changed during transcription. Nothing attached; retry on the current clip.')
        const id=randomUUID();const words=raw.segments.flatMap(s=>s.words).filter(w=>w.text.trim() && w.t_end_us>w.t_start_us).map((w,i)=>({id:`${id}:${i}`,text:w.text,roman:romanHindi(w.text),startUs:w.t_start_us-c.layer.t_start_us+c.p.src_in_us,endUs:w.t_end_us-c.layer.t_start_us+c.p.src_in_us}))
        if(!words.length)throw new Error('The local engine returned no timed words. Check audio/model readiness.')
        const doc:EditingTranscript={version:1,id,mediaId:c.p.media,sourceHash:source.file_hash_blake3,timing:raw.word_timing,words}
        const folder=path.join(ws,'Transcripts');fs.mkdirSync(folder,{recursive:true});const target=path.join(folder,id+'.json');fs.writeFileSync(target+'.tmp',JSON.stringify(doc));fs.renameSync(target+'.tmp',target)
        commitRef(c.layer.id,{version:1,id,corrections:{}});await deps.invoke('project_save',{});finish(j,'complete',{layerId:c.layer.id,words:words.length,timing:raw.word_timing,backend:raw.backend})
      }catch(e){if(j.state==='running')finish(j,'error',undefined,String(e))}})(); return j
    }
    if(name==='stich_export') {host();if(typeof a.path!=='string' || !path.isAbsolute(a.path) || !a.path.toLowerCase().endsWith('.mp4'))throw new Error('Choose an absolute, new .mp4 output path');if(fs.existsSync(a.path))throw new Error('Output already exists. Choose a new filename.');const j=begin('export');const staged=path.join(path.dirname(a.path),`.stich-${j.id}.mp4`);outputs.set(j.id,{target:a.path,staged});host().actor.setEditingBlocked(true);deps.startExport(j,staged,typeof a.resolutionHeight==='number'?a.resolutionHeight:null);return j}
    if(name==='stich_correct_text' || name==='stich_cut_words') {
      syncReceipts();if(typeof a.requestId!=='string' || a.requestId.length<8)throw new Error('A unique requestId is required')
      const signature=JSON.stringify([name,a]);const previous=receipts.get(a.requestId);if(previous){if(previous.signature!==signature)throw new Error('requestId was already used for different arguments');return previous.result}
      guard(a)
      const c=load(a.layerId); let result:unknown
      if(name==='stich_correct_text'){if(typeof a.text!=='string' || a.text.length>500 || !c.doc.words.some(w=>w.id===a.wordId))throw new Error('Use a known wordId and display text up to 500 characters');commitRef(c.layer.id,{...c.ref,corrections:{...c.ref.corrections,[String(a.wordId)]:a.text}});result={...status(),layerId:c.layer.id,wordId:a.wordId,text:a.text,mediaUnchanged:true}}
      else {if(!Array.isArray(a.wordIds) || !a.wordIds.length)throw new Error('Choose consecutive wordIds');const visible=read(c.layer.id).words;const indices=a.wordIds.map(id=>visible.findIndex(w=>w.id===id)).sort((x,y)=>x-y);if(indices[0]!<0 || indices.some((v,i)=>i>0 && v!==indices[i-1]!+1))throw new Error('Select consecutive surviving words in one clip');const start=visible[indices[0]!]!.timelineStartUs;const end=visible[indices.at(-1)!]!.timelineEndUs;const cuts=[start,end].filter(t=>t>c.layer.t_start_us && t<c.layer.t_end_us);const bounds=[c.layer.t_start_us,...cuts,c.layer.t_end_us];const discard=bounds.slice(0,-1).flatMap((s,i)=>(s+bounds[i+1]!)/2>=start && (s+bounds[i+1]!)/2<=end?[i]:[]);const r=c.h.actor.dispatch('split_layer_multi',{layer:c.layer.id,at_t_us_list:cuts,discard_segments:discard,ripple:true});if(!r.ok)throw new Error(JSON.stringify(r.error));result={...status(),survivingLayerIds:r.value,removedUs:end-start}}
      await deps.invoke('project_save',{});receipts.set(a.requestId,{signature,result});persistReceipts();return result
    }
    throw new Error('Unknown Stich operation: '+name)
  }
  return {run,status,exportUpdate,read,emit:deps.emit}
}
export type StichService=ReturnType<typeof createStichService>
