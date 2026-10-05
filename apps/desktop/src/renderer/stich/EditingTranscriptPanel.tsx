import { useEffect, useState } from 'react'
import { invoke } from '../bridge/ipc'
import { listen } from '../bridge/events'
import { usePrimaryLayerId, setLayerSelection } from '../state/selectionStore'
import { usePlaybackStore, transportPlay, transportPause, transportSeek } from '../state/playbackStore'
import { projectUndo, projectRedo, trimLayer } from '../ipc'
import { browserMode } from './browserRuntime'
import { useProjectStore } from '../state/projectStore'
import type { SpeechWord, StichJob } from '../../shared/stich'
import './transcript.css'

type Word=SpeechWord & {display:string;timelineStartUs:number;timelineEndUs:number}
interface View {words:Word[];workspace:string;revision:number;timing:string}
export function EditingTranscriptPanel() {
  useEffect(()=>{
    const ready=listen<{requestId:string;target:string;action:string;timeUs?:number}>('stich:preview-request',e=>{
      if((e.payload.target==='browser')!==browserMode)return
      if(e.payload.action==='seek')transportSeek(e.payload.timeUs??0)
      else if(e.payload.action==='play')transportPlay()
      else transportPause()
      setTimeout(()=>{const {playing,requestedPlaying,phase,error}=usePlaybackStore.getState();void invoke('stich_preview_update',{requestId:e.payload.requestId,state:{playing,requestedPlaying,phase,error,requestedAction:e.payload.action}})},250)
    });return()=>{void ready.then(f=>f())}
  },[])
  const layerId=usePrimaryLayerId();const summary=useProjectStore(s=>s.summary)
  const [open,setOpen]=useState(false),[view,setView]=useState<View|null>(null),[error,setError]=useState(''),[selected,setSelected]=useState<number[]>([]),[busy,setBusy]=useState(false),[jobs,setJobs]=useState<StichJob[]>([]),[spelling,setSpelling]=useState(''),[language,setLanguage]=useState('auto')
  const layer=Object.values(summary?.compositions??{}).flatMap(c=>c.tracks.flatMap(t=>t.layers)).find(l=>l.id===layerId)
  useEffect(()=>{
    if(!open || layerId)return
    const clips=Object.values(summary?.compositions??{}).flatMap(c=>c.tracks.flatMap(t=>t.layers)).filter(l=>l.params.kind==='VideoClip')
    if(clips.length===1)setLayerSelection(clips[0]!.id,[clips[0]!.id])
  },[open,layerId,summary])
  async function refresh() {try {setView(await invoke<View>('stich_read_transcript',{layerId}));setError('')}catch {setView(null)} const status=await invoke<{jobs:StichJob[]}>('stich_status');setJobs(status.jobs)}
  useEffect(()=>{if(!open)return;setSelected([]);void refresh();const clean=listen('stich:changed',()=>void refresh());return()=>{void clean.then(f=>f())}},[layerId,open,summary?.project_id])
  async function act(name:string,args:Record<string,unknown>) {setBusy(true);setError('');try {const result=await invoke<{survivingLayerIds?:string[]}>(name,{...args,layerId,workspace:view?.workspace,revision:view?.revision,requestId:crypto.randomUUID()});if(result?.survivingLayerIds?.length){const next=result.survivingLayerIds.at(-1)!;setLayerSelection(next,[next]);}setSelected([]);await refresh()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
  const first=view?.words[selected[0]??-1];const last=view?.words[selected.at(-1)??-1]
  async function trim(edge:'start'|'end',delta:number) {if(!layerId || !layer)return;setError('');try{await trimLayer(layerId,edge==='start'?'in':'out',(edge==='start'?layer.t_start_us:layer.t_end_us)+delta);await refresh()}catch(e){setError(String(e))}}
  return <>
    <button className="stich-speech-toggle" onClick={()=>setOpen(v=>!v)}>Speech transcript</button>
    {open && <aside className="stich-speech" aria-label="Editing transcript">
      <header><div><strong>Editing transcript</strong><small>Local speech · Roman Hindi · Original footage preserved</small></div><button onClick={()=>setOpen(false)} aria-label="Close transcript">×</button></header>
      <div className="stich-controls"><select aria-label="Speech language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="auto">Detect language</option><option value="en">English</option><option value="hi">Hindi / Hinglish</option></select><button onClick={()=>void act('stich_setup_local_speech',{})}>Install local Whisper</button><button disabled={!layerId||busy||jobs.some(j=>j.state==='running')} onClick={()=>void act('stich_transcribe',{language})}>Transcribe selected clip</button><button onClick={()=>{void projectUndo().then(refresh)}}>Undo / restore</button><button onClick={()=>void projectRedo().then(refresh)}>Redo</button></div>
      {jobs.filter(j=>j.state==='running'||j.state==='error').map(j=><p key={j.id} role="status">{j.kind}: {j.error??j.stage} {j.state==='running'&&<button onClick={()=>void act('stich_cancel_job',{jobId:j.id})}>Cancel</button>}</p>)}
      {error&&<p className="stich-error" role="alert">{error}</p>}
      {!layerId && <p>Select your main video clip on the timeline.</p>}
      {layerId&&!view&&<p>Generate a transcript for this clip. Recognition stays on this Mac. Install/select Whisper Base in Settings → Models first.</p>}
      {view&&<>
        <p className="stich-note">Click words to select. Shift-click selects a range. Cutting removes picture and linked sound; correcting spelling changes text only. Timing: {view.timing.replaceAll('_',' ')} — audition each join.</p>
        <div className="stich-words">{view.words.map((w,i)=><button key={w.id} className={selected.includes(i)?'selected':''} title={`${(w.timelineStartUs/1e6).toFixed(2)}s`} onClick={e=>{if(e.shiftKey&&selected.length){const a=Math.min(selected[0]!,i),b=Math.max(selected[0]!,i);setSelected(Array.from({length:b-a+1},(_,n)=>a+n))}else{setSelected([i]);setSpelling(w.display)}transportSeek(w.timelineStartUs)}}>{w.display}</button>)}</div>
        <div className="stich-controls"><button disabled={!first||busy} onClick={()=>void act('stich_cut_words',{wordIds:selected.map(i=>view.words[i]!.id)})}>Cut selected words</button><button disabled={!first} onClick={()=>{transportSeek(Math.max(0,first!.timelineStartUs-700000));transportPlay()}}>Play nearby</button><button onClick={transportPause}>Pause</button></div>
        {selected.length===1&&<form className="stich-correct" onSubmit={e=>{e.preventDefault();void act('stich_correct_text',{wordId:first!.id,text:spelling})}}><input aria-label="Correct spelling" value={spelling} onChange={e=>setSpelling(e.target.value)}/><button disabled={busy}>Correct spelling only</button></form>}
        {first&&last&&<small>Selection {(first.timelineStartUs/1e6).toFixed(2)}–{(last.timelineEndUs/1e6).toFixed(2)} seconds.</small>}
      </>}
      {layer&&<div className="stich-controls"><span>Clip edges · 0.1 seconds</span><button onClick={()=>void trim('start',-100000)}>Start earlier</button><button onClick={()=>void trim('start',100000)}>Start later</button><button onClick={()=>void trim('end',-100000)}>End earlier</button><button onClick={()=>void trim('end',100000)}>End later</button></div>}
    </aside>}
  </>
}
