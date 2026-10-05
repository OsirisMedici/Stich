import { connectBrowserRuntime } from './browserRuntime'
try { await connectBrowserRuntime(); await import('../main') }
catch(e) {const root=document.getElementById('root')!;const p=document.createElement('p');p.style.cssText='color:#eee;background:#151515;padding:40px;font:16px system-ui';p.textContent=String(e)+'. Open the browser editor again from Stich.';root.append(p)}
