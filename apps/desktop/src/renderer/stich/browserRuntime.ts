import type { WeftcutApi } from '../../shared/ipc'
export const browserMode = location.protocol === 'http:' && location.pathname.startsWith('/stich/')
const listeners=new Map<string,Set<(payload:unknown)=>void>>()
const noop=async()=>{}; const unavailable=async()=>{throw new Error('This feature requires the desktop runtime interface')}
async function jsonCall(url:string,body:unknown) {const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw new Error(result.error??`Stich request failed (${response.status})`);return result.value}
export async function connectBrowserRuntime(): Promise<void> {
  const grant=new URLSearchParams(location.hash.slice(1)).get('grant')
  if(grant){await jsonCall('/stich/session',{grant});history.replaceState(null,'',location.pathname)}
  const utility=(method:string,...args:unknown[])=>jsonCall('/stich/api/utility',{method,args})
  const binary=async(method:string,...args:unknown[])=>{const r=await fetch('/stich/api/utility',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({method,args})});if(!r.ok)throw new Error((await r.json()).error);return new Uint8Array(await r.arrayBuffer())}
  const on=(event:string,cb:(payload:unknown)=>void)=>{let set=listeners.get(event);if(!set){set=new Set();listeners.set(event,set)}set.add(cb);return ()=>{set!.delete(cb)}}
  // A real adapter for named capabilities, not an arbitrary IPC tunnel. Native
  // frame transports are deliberately unavailable: browser uses the Lite path.
  const api={
    backend:{invoke:(channel:string,args:unknown={})=>jsonCall('/stich/api/core',{channel,args})},
    on,off:(event:string)=>listeners.delete(event),emit:noop,
    fs:{readFile:(p:string)=>binary('fs.readFile',p),exists:(p:string)=>utility('fs.exists',p),readDir:(p:string)=>utility('fs.readDir',p),writeFile:unavailable,writeTextFile:unavailable,mkdir:unavailable,remove:unavailable},
    dialog:{open:(o:unknown)=>utility('dialog.open',o),save:(o:unknown)=>utility('dialog.save',o)},
    path:{documentDir:()=>utility('path.documentDir'),tempDir:()=>utility('path.tempDir'),join:(parts:string[])=>utility('path.join',parts)},
    window:{minimize:noop,toggleMaximize:async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()},close:async()=>window.close(),isMaximized:async()=>false,setTitle:async(title:string)=>{document.title=title},captureSnapshot:unavailable,focus:async()=>window.focus()},
    win:{create:unavailable,act:unavailable,exists:async()=>false},
    mcp:{getInfo:async()=>({bind:location.host,url:location.origin+'/mcp',browser:true}),resetToken:unavailable,reinstallSkills:unavailable},
    app:{notices:async()=>[],versions:async()=>({app:'Stich MVP',electron:'Local runtime',chrome:navigator.userAgent,node:'Local runtime'})},
    updates:{status:async()=>({state:'idle'}),check:unavailable}, menu:{sync:noop},media:{dropped:unavailable},
    shell:{open:unavailable,reveal:(p:string)=>utility('shell.reveal',p)},notification:{send:noop},
    font:{listFamilies:()=>utility('font.listFamilies'),resolve:async(f:string)=>binary('font.resolve',f)},
    metrics:{get:unavailable},dataRoot:{current:unavailable,pendingCleanup:async()=>null,pickAndMigrate:unavailable,deleteOld:unavailable,dismissCleanup:noop,openFolder:unavailable,relaunch:unavailable},
    colorPick:{start:unavailable,cancel:noop,onHover:()=>()=>{}},
    decodeComponent:{status:async()=>({available:false,reason:'Browser uses WebCodecs with compatible local media',version:null})},
    decodeCap:{probeSw:async()=>({ok:false,classKey:null,reason:'Use browser decoding'}),probeHw:async()=>({ok:false,lane:null,reason:'Electron native textures are not browser transports'})},
    previewGpu:{open:unavailable,close:noop,requestFrameAt:unavailable,requestPort:unavailable,budget:async()=>null},
    previewSw:{open:unavailable,close:noop,requestFrameAt:unavailable,onFrame:()=>()=>{}},
    exportSw:{open:unavailable,close:noop,closeAll:noop,decodeRange:unavailable,returnCredit:noop,onMsg:()=>()=>{}},videoSinkWrite:unavailable,
  }
  window.api=api as unknown as WeftcutApi
  const events=new EventSource('/stich/api/events')
  events.onmessage=e=>{const {event,payload}=JSON.parse(e.data);for(const fn of listeners.get(event)??[])fn(payload)}
  events.onerror=()=>{document.documentElement.dataset.stichConnection='reconnecting'}
  events.onopen=()=>{document.documentElement.dataset.stichConnection='connected';for(const fn of listeners.get('project:changed')??[])fn({})}
  const modelContext=(document as Document & {modelContext?:{registerTool(tool:unknown):void}}).modelContext
  if(modelContext){
    const tools=await fetch('/stich/api/tools').then(r=>r.json())
    for(const tool of tools.filter((t:{name:string})=>t.name.startsWith('stich_') || ['read_project','create_project','open_project','import_media','add_video_layer','add_audio_layer','add_track','move_layer','trim_layer','split_layer','delete_layers','undo','redo','create_checkpoint','restore_checkpoint','list_checkpoints','ensure_full_proxy'].includes(t.name))) modelContext.registerTool({...tool,execute:async(args:unknown)=>{const value=await jsonCall('/stich/api/tool',{name:tool.name,args});return value && Array.isArray(value.content)?value:{content:[{type:'text',text:JSON.stringify(value)}]}}})
  }
}
