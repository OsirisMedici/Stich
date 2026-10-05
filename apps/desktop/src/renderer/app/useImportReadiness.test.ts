// @vitest-environment jsdom
import {renderHook,waitFor} from '@testing-library/react'
import {createRef} from 'react'
import {expect,it,vi} from 'vitest'
import {summaryFixture} from '../testing/summaryFixture'
import type {MediaSummary} from '../ipc'
import {useProjectStore} from '../state/projectStore'
import {useImportReadiness} from './useImportReadiness'

const probe=vi.hoisted(()=>vi.fn(async()=> 'ok' as const))
vi.mock('../render/decoder/probeSourceDecodable',()=>({classifyWebcodecsDecodability:probe}))
vi.mock('@/bridge/ipc',()=>({invoke:async(channel:string)=>channel==='import_queue_list'?[]:null,convertFileSrc:(p:string)=>p}))
vi.mock('@/bridge/events',()=>({listen:async()=>()=>{}}))
vi.mock('@/bridge/dialog',()=>({open:async()=>null}))
vi.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string)=>key})}))

it('probes the incoming project even when the separately refreshed shared store is still empty',async()=>{
  useProjectStore.getState().apply(null)
  const media:MediaSummary={id:'phone',label:'phone.mov',path:'/phone.mov',kind:'Video',codec:'hevc',pix_fmt:'yuv420p',duration_us:1_000_000,start_pts_us:0,width:3840,height:2160,size_bytes:100,available:true,decode_route:{route:'proxied',format_version:0,quick_proxy:null,full_proxy:null}}
  const previewRef=createRef<never>()
  const {result,unmount}=renderHook(()=>useImportReadiness({summary:summaryFixture({media:[media]}),run:async f=>{await f()},previewRef}))
  await waitFor(()=>expect(probe).toHaveBeenCalledWith('/phone.mov'))
  await waitFor(()=>expect(result.current.previewDecodableMediaIds.has('phone')).toBe(true))
  unmount()
})
