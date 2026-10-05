import { useState } from 'react'
import { save } from '../bridge/dialog'
import { AppDialog } from '../components/AppDialog'
import { DEFAULT_EXPORT_SETTINGS, type ExportSettings } from '../render/exportSettings'

/** The browser MVP exposes the settings its runtime job actually supports. */
export function BrowserExportDialog({onCancel,onConfirm}:{onCancel:()=>void;onConfirm:(settings:ExportSettings,path:string)=>void}) {
  const [height,setHeight]=useState<number|null>(1080)
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  async function choose() {
    setBusy(true);setError('')
    try {
      const output=await save({title:'Export trimmed MP4',defaultPath:'stich-export.mp4',filters:[{name:'MP4 video',extensions:['mp4']}]})
      if(output)onConfirm({...DEFAULT_EXPORT_SETTINGS,resolutionHeight:height},output)
    }catch(e){setError(String(e))}finally{setBusy(false)}
  }
  return <AppDialog title="Export MP4" onClose={onCancel} panelClassName="settings-panel">
    <div className="settings-body"><p>Export the entire edited timeline as H.264 video with AAC sound. Rendering stays on this Mac. Keep Stich running until it finishes.</p>
      <label>Output height <select value={height??''} onChange={e=>setHeight(e.target.value?Number(e.target.value):null)}><option value="1080">1080 pixels</option><option value="1920">1920 pixels</option><option value="">Original size</option></select></label>
      {error&&<p role="alert">{error}</p>}<div className="export-actions"><button onClick={onCancel}>Cancel</button><button disabled={busy} onClick={()=>void choose()}>Choose file and export</button></div>
    </div>
  </AppDialog>
}
