// Generate the packaging master from Stich's canonical generated PNG.
// The renderer uses public/icons/icon.png; electron-builder uses build/icon.png.
// Run npm run gen:icons --workspace apps/desktop to resize it to 1024px.
// A hidden Electron canvas preserves alpha without extra image libraries.
import { app, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const sourcePath = join(here, '..', 'src', 'renderer', 'public', 'icons', 'icon.png')
const outPath = join(here, '..', 'build', 'icon.png')
const SIZE = 1024

const imageSource = 'data:image/png;base64,' + readFileSync(sourcePath).toString('base64')

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: SIZE, height: SIZE })
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<meta charset="utf-8">'))

  const dataUrl = await win.webContents.executeJavaScript(`(async () => {
    const img = new Image();
    img.src = ${JSON.stringify(imageSource)};
    await img.decode();
    const c = document.createElement('canvas');
    c.width = ${SIZE}; c.height = ${SIZE};
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, ${SIZE}, ${SIZE});
    ctx.drawImage(img, 0, 0, ${SIZE}, ${SIZE});
    return c.toDataURL('image/png');
  })()`)

  const b64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  const bytes = Buffer.from(b64, 'base64')
  writeFileSync(outPath, bytes)
  console.log(`gen-icons: wrote ${outPath} (${SIZE}x${SIZE}, ${bytes.length} bytes)`)
  app.quit()
}).catch((err) => {
  console.error('gen-icons failed:', err)
  app.exit(1)
})
