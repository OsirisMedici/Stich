// Branding-only Mac builds may reuse the unchanged native bits of WeftCut 0.3.0.
// For native source changes, use the normal bootstrap/compiler instead.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { extractFile } from '@electron/asar'

const desktop = path.resolve(import.meta.dirname, '..')
const repo = path.resolve(desktop, '../..')
const appBundle = process.argv[2] ?? '/Applications/WeftCut.app'
const version = execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleShortVersionString', path.join(appBundle, 'Contents/Info.plist')], {encoding:'utf8'}).trim()
if (process.platform !== 'darwin' || process.arch !== 'arm64' || version !== '0.3.0') throw new Error('Requires the official WeftCut 0.3.0 arm64 Mac bundle.')
const diff = execFileSync('git', ['diff', 'v0.3.0', '--', 'apps/desktop/native'], {cwd:repo,encoding:'utf8'})
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', 'apps/desktop/native'], {cwd:repo,encoding:'utf8'})
if (diff || untracked) throw new Error('Native sources changed. Compile them using npm run bootstrap instead of reusing binaries.')
const resources = path.join(appBundle, 'Contents/Resources')
for (const [moduleName, destination] of [['core','native'], ['native-decode','native/decode']]) {
 const source = path.join(resources, 'app.asar.unpacked/node_modules/@weftcut',moduleName)
 const target = path.join(desktop,destination)
 mkdirSync(target,{recursive:true})
 if(!existsSync(path.join(target,'index.d.ts'))) throw new Error('Restore the matching generated index.d.ts from the VPS or compile the native component first. Release bundles omit development types.')
 for(const file of readdirSync(source)) if(file.endsWith('.node') || file.endsWith('.dylib')) cpSync(path.join(source,file),path.join(target,file),{dereference:true,force:true})
 for(const file of ['index.js']) writeFileSync(path.join(target,file),extractFile(path.join(resources,'app.asar'),`node_modules/@weftcut/${moduleName}/${file}`))
}
cpSync(path.join(resources,'ffmpeg'),path.join(desktop,'resources/ffmpeg/mac'),{recursive:true,filter:(p)=>path.basename(p)!=='LICENSE.txt'})
cpSync(path.join(resources,'native-decode'),path.join(desktop,'resources/ffmpeg-lgpl/mac'),{recursive:true})
console.log('Staged unchanged official native components and license/provenance materials.');
