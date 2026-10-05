import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { randomBytes } from 'node:crypto'
import { dialog, app, shell } from 'electron'
import type { StichService } from './service'
import { isInside } from '../fsGuard'
import { STICH_TOOL_DEFS } from '../../shared/stich'
import { listSystemFontFamilies, resolveSystemFont } from '../fonts/resolveSystemFont'
import type { TsActorHost } from '../state/ts-actor-host'
import { STICH_TOOLS } from '../../shared/stich'
import { BROWSER_CHANNELS } from './channels'

export function mountBrowserHost(target: express.Express, deps: {service:StichService;host():TsActorHost|null;workspace():string|null;invoke(channel:string,args:Record<string,unknown>):Promise<unknown>; tools():Promise<unknown[]>; callTool(name:string,args:Record<string,unknown>):Promise<unknown>}) {
  const grants=new Map<string,number>();const sessions=new Map<string,number>();const listeners=new Set<express.Response>();const picked=new Set<string>()
  const router=express.Router(); const session=(req:express.Request)=>{const token=(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith('stich_session='))?.slice(14);return !!token && (sessions.get(token)??0)>Date.now()}
  router.use((req,res,next)=>{const expected=`127.0.0.1:${req.socket.localPort}`;if(req.headers.host!==expected)return res.status(403).json({error:'Invalid localhost host'});if(req.headers.origin && req.headers.origin!==`http://${expected}`)return res.status(403).json({error:'Invalid origin'});res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');if(Number(req.headers['content-length']??0)>1024*1024)return res.status(413).json({error:'Request too large'});next()})
  router.post('/session',(req,res)=>{const grant=req.body?.grant;if(typeof grant!=='string' || (grants.get(grant)??0)<Date.now())return res.status(401).json({error:'Launch Stich again to connect'});grants.delete(grant);const token=randomBytes(32).toString('hex');sessions.set(token,Date.now()+12*60*60*1000);res.setHeader('Set-Cookie',`stich_session=${token}; HttpOnly; SameSite=Strict; Path=/stich`);res.json({ok:true})})
  router.use('/api',(req,res,next)=>{if(!session(req))return res.status(401).json({error:'Stich session expired; reopen the editor from Stich.'});if(req.method!=='GET' && req.headers.origin!==`http://${req.headers.host}`)return res.status(403).json({error:'Mutation requires same origin'});next()})
  const asyncRoute=(fn:(req:express.Request,res:express.Response)=>Promise<unknown>)=>(req:express.Request,res:express.Response)=>{void fn(req,res).catch(e=>res.status(400).json({error:e instanceof Error?e.message:String(e)}))}
  router.post('/api/core',asyncRoute(async(req,res)=>{const {channel,args={}}=req.body??{};if(!BROWSER_CHANNELS.has(channel))throw new Error('This operation is unavailable in the browser: '+channel);if(channel==='models_use' && args.id!=='whisper-base')throw new Error('This workflow uses local Whisper only');res.json({value:await deps.invoke(channel,args)})}))
  // Keep page tools focused: browser tool registries have bounded catalogs.
  const pageTools=new Set(['read_project','create_project','open_project','import_media','add_video_layer','add_audio_layer','add_track','move_layer','trim_layer','split_layer','delete_layers','undo','redo','create_checkpoint','restore_checkpoint','list_checkpoints','ensure_full_proxy'])
  router.post('/api/tool',asyncRoute(async(req,res)=>{const name=req.body.name;if(STICH_TOOLS.some(t=>t[0]===name)&&name!=='open_stich_editor')res.json({value:await deps.service.run(name,req.body.args??{})});else if(pageTools.has(name))res.json({value:await deps.callTool(name,req.body.args??{})});else throw new Error('This tool is unavailable in the browser: '+name)}))
  router.get('/api/tools',asyncRoute(async(_req,res)=>res.json([...(await deps.tools() as Array<{name:string}>).filter(t=>pageTools.has(t.name)),...STICH_TOOL_DEFS.filter(t=>t.name!=='open_stich_editor')])))
  router.get('/api/events',(req,res)=>{res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(': connected\n\n');listeners.add(res);req.on('close',()=>listeners.delete(res))})
  const exported=(file:string)=>deps.service.status().jobs.some(j=>j.kind==='export'&&j.state==='complete'&&(j.result as {outputPath?:string}|undefined)?.outputPath===file)
  const allowed=(file:string)=>{const absolute=path.resolve(file);const p=deps.host()?.actor.snapshot();return picked.has(absolute) || exported(absolute) || Object.values(p?.media_pool??{}).some(m=>absolute===path.resolve(m.path_abs)) || !!deps.workspace() && isInside(path.join(deps.workspace()!,'Cache'),absolute)}
  const checked=(file:unknown)=>{if(typeof file!=='string' || !path.isAbsolute(file) || !allowed(file))throw new Error('File is outside this project and its selected media');const real=fs.realpathSync(file);const knownSources=Object.values(deps.host()?.actor.snapshot().media_pool??{}).some(m=>fs.existsSync(m.path_abs)&&fs.realpathSync(m.path_abs)===real);const cache=deps.workspace()?path.join(deps.workspace()!,'Cache'):null;if(!knownSources && !picked.has(real) && !exported(real) && !(cache&&fs.existsSync(cache)&&isInside(fs.realpathSync(cache),real)))throw new Error('File resolves outside registered media');return real}
  router.get('/media/:asset',asyncRoute(async(req,res)=>{if(!session(req))return res.status(401).end();const file=checked(req.params.asset);const stat=fs.statSync(file);if(!stat.isFile())throw new Error('Not a media file');let start=0,end=stat.size-1;const range=req.headers.range;if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m || (!m[1]&&!m[2]))return res.status(416).set('Content-Range',`bytes */${stat.size}`).end();if(!m[1])start=Math.max(0,stat.size-Number(m[2]));else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]))}if(start>end||start>=stat.size)return res.status(416).set('Content-Range',`bytes */${stat.size}`).end();res.status(206).set('Content-Range',`bytes ${start}-${end}/${stat.size}`)}res.set('Accept-Ranges','bytes').set('Content-Length',String(end-start+1));const ext=path.extname(file).toLowerCase();res.type(({'.mp4':'video/mp4','.mov':'video/quicktime','.webm':'video/webm','.wav':'audio/wav','.png':'image/png','.jpg':'image/jpeg'} as Record<string,string>)[ext]??'application/octet-stream');const stream=fs.createReadStream(file,{start,end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());stream.pipe(res)}))
  router.post('/api/utility',asyncRoute(async(req,res)=>{const {method,args=[]}=req.body??{};let value:unknown
    switch(method){
      case 'dialog.open':{value=await dialog.showOpenDialog({title:args[0]?.title,defaultPath:args[0]?.defaultPath,filters:args[0]?.filters,properties:[args[0]?.directory?'openDirectory':'openFile',...(args[0]?.multiple?['multiSelections' as const]:[])]}).then(r=>r.canceled?null:args[0]?.multiple?r.filePaths:r.filePaths[0]??null);for(const p of Array.isArray(value)?value:typeof value==='string'?[value]:[])picked.add(path.resolve(p));break}
      case 'dialog.save':value=await dialog.showSaveDialog(args[0]??{}).then(r=>r.canceled?null:r.filePath??null);break
      case 'path.documentDir':value=app.getPath('documents');break
      case 'path.tempDir':value=os.tmpdir();break
      case 'path.join':value=path.join(...args[0]);break
      case 'fs.exists':value=typeof args[0]==='string' && allowed(args[0]) && fs.existsSync(args[0]);break
      case 'fs.readFile':{const file=checked(args[0]);if(fs.statSync(file).size>64*1024*1024)throw new Error('Use range media reads for large files');return fs.createReadStream(file).pipe(res)}
      case 'fs.readDir':{const file=checked(args[0]);value=fs.readdirSync(file,{withFileTypes:true}).map(d=>({name:d.name,isFile:d.isFile(),isDirectory:d.isDirectory(),isSymlink:d.isSymbolicLink()}));break}
      case 'font.listFamilies':value=await listSystemFontFamilies();break
      case 'font.resolve':{const data=await resolveSystemFont(args[0]);if(data)return res.end(data);return res.status(204).end()}
      case 'shell.reveal':await shell.showItemInFolder(checked(args[0]));value=null;break
      default:throw new Error('Desktop-only operation: '+method)
    }res.json({value})
  }))
  router.use(express.static(path.join(app.getAppPath(),'out/renderer')))
  target.use('/stich',router)
  return {launch(port:number){const grant=randomBytes(32).toString('hex');grants.set(grant,Date.now()+60_000);return `http://127.0.0.1:${port}/stich/browser.html#grant=${grant}`},emit(event:string,payload:unknown){for(const r of listeners)r.write(`data: ${JSON.stringify({event,payload})}\n\n`)},close(){for(const r of listeners)r.end();listeners.clear()}}
}
export type BrowserHost=ReturnType<typeof mountBrowserHost>
