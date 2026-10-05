import { describe,it,expect,vi,afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createActor } from '../state/actor'
import { seededGen } from '../state/ids'
import { blankProject } from '../state/model'
import { mediaItemTemplate } from '../state/mutations/media'
import type { TsActorHost } from '../state/ts-actor-host'
import { createStichService } from './service'
import { copyTranscriptArtifacts } from './artifacts'

const folders:string[]=[]
afterEach(()=>{for(const f of folders.splice(0))fs.rmSync(f,{recursive:true,force:true})})
async function fixture() {
 const ws=fs.mkdtempSync(path.join(os.tmpdir(),'stich-speech-test-'));folders.push(ws)
 const gen=seededGen(),project=blankProject(gen,'speech'),mid=gen();project.media_pool[mid]=mediaItemTemplate(mid,'Video',4_000_000,true)
 const actor=createActor({initial:project,idGen:gen})
 const added=actor.mcpCall('add_video_layer',JSON.stringify({media_id:mid,track_id:project.compositions[project.root_id]!.tracks[0]!.id,t_start_us:0,t_end_us:4_000_000,src_in_us:0,src_out_us:4_000_000}))
 expect(added.ok).toBe(true)
 const layers=()=>Object.values(actor.snapshot().compositions).flatMap(c=>c.tracks.flatMap(t=>t.layers))
 const layer=layers().find(l=>l.params.kind==='VideoClip')!
 const host={actor,openedProject:()=>({path:ws})} as unknown as TsActorHost
 const result={segments:[{words:[{text:'Hello',t_start_us:0,t_end_us:1_000_000},{text:'world',t_start_us:1_000_000,t_end_us:2_000_000},{text:'again',t_start_us:2_000_000,t_end_us:3_000_000}]}],word_timing:'exact',backend:'whisper_cpp'}
 const service=createStichService({host:()=>host,workspace:()=>ws,invoke:async()=>null,transcribe:async()=>result,startExport:()=>{},emit:()=>{}})
 await service.run('stich_transcribe',{layerId:layer.id})
 await vi.waitFor(()=>expect(service.status().jobs[0]!.state).toBe('complete'))
 const view=service.read(layer.id)
 const request=(wordIds:string[])=>({layerId:layer.id,wordIds,workspace:view.workspace,revision:view.revision,requestId:'request-12345'})
 return {service,actor,layer,view,request,layers,ws,host}
}
describe('source-anchored speech editing',()=>{
 it('keeps imported frame/sample tail padding paired when trimming a video edge',async()=>{const f=await fixture();const p=structuredClone(f.actor.snapshot());const audio=Object.values(p.compositions).flatMap(c=>c.tracks.flatMap(t=>t.layers)).find(l=>l.params.kind==='Audio')!;audio.t_end_us=3_998_333;if(audio.params.kind==='Audio')audio.params.src_out_us=3_998_333;f.actor.replaceState(p);const r=f.actor.mcpCall('trim_layer',JSON.stringify({layer_id:f.layer.id,edge:'out',new_t_us:3_000_000}));expect(r.ok).toBe(true);expect(f.layers().filter(l=>['Audio','VideoClip'].includes(l.params.kind)).map(l=>l.t_end_us)).toEqual([3_000_000,3_000_000])})
 it('keeps immutable speech artifacts usable after Save As and refuses collisions',async()=>{const f=await fixture();const dest=path.join(f.ws,'new-project');copyTranscriptArtifacts(f.actor.snapshot(),f.ws,dest);const filename=fs.readdirSync(path.join(f.ws,'Transcripts'))[0]!;const copied=path.join(dest,'Transcripts',filename);expect(fs.readFileSync(copied)).toEqual(fs.readFileSync(path.join(f.ws,'Transcripts',filename)));fs.writeFileSync(copied,'conflicting document');expect(()=>copyTranscriptArtifacts(f.actor.snapshot(),f.ws,dest)).toThrow('conflicting')})
 it('corrects display text without changing source ranges, and undo restores spelling',async()=>{const f=await fixture();const ranges=f.layers().map(l=>[l.t_start_us,l.t_end_us,l.params]);await f.service.run('stich_correct_text',{...f.request([]),wordId:f.view.words[0]!.id,text:'Hallo'});expect(f.service.read(f.layer.id).words[0]!.display).toBe('Hallo');expect(f.layers().map(l=>[l.t_start_us,l.t_end_us,l.params])).toEqual(ranges);f.actor.dispatch('undo',{});expect(f.service.read(f.layer.id).words[0]!.display).toBe('Hello')})
 it('cuts linked video/audio in one undo step and keeps original word anchors',async()=>{const f=await fixture();const before=f.actor.historyStatus().len;const r=await f.service.run('stich_cut_words',f.request([f.view.words[1]!.id])) as {survivingLayerIds:string[]};expect(f.actor.historyStatus().len).toBe(before+1);const videos=f.layers().filter(l=>l.params.kind==='VideoClip');const audio=f.layers().filter(l=>l.params.kind==='Audio');expect(videos).toHaveLength(2);expect(audio).toHaveLength(2);expect(videos.map(l=>[l.t_start_us,l.t_end_us])).toEqual(audio.map(l=>[l.t_start_us,l.t_end_us]));expect(f.service.read(r.survivingLayerIds[1]!).words[0]!.text).toBe('again');f.actor.dispatch('undo',{});expect(f.service.read(f.layer.id).words).toHaveLength(3)})
 it('refuses stale writes and nonconsecutive selections without history changes',async()=>{const f=await fixture();const n=f.actor.historyStatus().len;await expect(f.service.run('stich_cut_words',{...f.request([f.view.words[0]!.id]),revision:-1})).rejects.toThrow('Stale');await expect(f.service.run('stich_cut_words',f.request([f.view.words[0]!.id,f.view.words[2]!.id]))).rejects.toThrow('consecutive');expect(f.actor.historyStatus().len).toBe(n)})
 it('deduplicates a retry after commit even though the supplied revision is old',async()=>{const f=await fixture();const req=f.request([f.view.words[1]!.id]);const first=await f.service.run('stich_cut_words',req);const n=f.actor.historyStatus().len;expect(await f.service.run('stich_cut_words',req)).toEqual(first);expect(f.actor.historyStatus().len).toBe(n);expect(fs.existsSync(path.join(f.ws,'Cache','Stich','receipts.json'))).toBe(true)})
 it('preserves transcript references through serialization-independent clip splits',async()=>{const f=await fixture();f.actor.dispatch('split_layer',{layer:f.layer.id,at_t_us:2_000_000});const clips=f.layers().filter(l=>l.params.kind==='VideoClip');expect(clips.every(l=>l.metadata.stich_transcript)).toBe(true);expect(f.service.read(clips[1]!.id).words[0]!.id).toBe(f.view.words[2]!.id)})
 it('blocks edits and project undo while a runtime export holds its snapshot',async()=>{const f=await fixture();const before=f.actor.snapshot();await f.service.run('stich_export',{path:path.join(f.ws,'out.mp4')});expect(f.actor.isEditingBlocked()).toBe(true);expect(f.actor.dispatch('undo',{}).ok).toBe(false);expect(f.actor.mcpCall('undo','{}').ok).toBe(false);expect(f.actor.snapshot()).toBe(before);await f.service.exportUpdate(f.service.status().jobs.at(-1)!.id,{kind:'error',detail:'test interrupted'});expect(f.actor.isEditingBlocked()).toBe(false)})
 it('refuses retimed source mapping before launching recognition',async()=>{const f=await fixture();const p=structuredClone(f.actor.snapshot());const c=Object.values(p.compositions).flatMap(c=>c.tracks.flatMap(t=>t.layers)).find(l=>l.id===f.layer.id)!;if(c.params.kind==='VideoClip')c.params.time_map={kind:'Affine',rate:{num:2,den:1}};f.actor.replaceState(p);await expect(f.service.run('stich_transcribe',{layerId:f.layer.id})).rejects.toThrow('normal-speed')})
})
