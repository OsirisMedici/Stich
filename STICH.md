# Stich

Stich is Osiris's private customization of WeftCut 0.3.0. The official WeftCut application remains available for its current editing project. Keep these two applications and their active projects separate.

| Identity | Official | Private version |
| --- | --- | --- |
| Mac application | /Applications/WeftCut.app | /Applications/Stich.app |
| Bundle identity | dev.weftcut.desktop | com.osiris.stich |
| Profile on Mac | ~/Library/Application Support/WeftCut | ~/Library/Application Support/Stich |
| Codex MCP entry | weftcut | stich |
| Codex skill | ~/.codex/skills/weftcut | ~/.codex/skills/stich |
| Automatic upstream installation | Upstream behavior | Disabled |

The private app has an orange film-strip S icon, Stich startup screen, window titles, About dialog and agent-setup instructions. Upstream copyright and license notices remain intact. Internal @weftcut packages, project format, protocol notifications and compatibility helper tool names are retained.

## Source locations

- Mac: /Users/osirismedici/Documents/WeftCut/source
- VPS: /home/canvasadmin/projects/weftcut
- Customization branch: codex/stich-branding
- Upstream base: v0.3.0, commit 51e5754b63dfee57a34fd5d4208bc80f4d2cc9ee

The local clone's origin is the VPS checkout. Its upstream remote points to the official GitHub repository. The VPS origin remains the official GitHub repository. No public repository or release is created by this setup.

## Rebuilding

The first Mac package rebuilds the Electron app from this source, reuses the unchanged native Mac components from the verified official 0.3.0 installation, and uses the portable WASM module built on the VPS from the identical native source. Reusing compiled components is limited to branding/UI changes. The staging helper refuses changed native sources.

The isolated Mac Node runtime is under /Users/osirismedici/.local/share/weftcut-dev/node-v24.21.0-darwin-arm64. Add its bin directory to PATH for the build session; no shared Homebrew runtime is replaced.

For a fresh full source build, install the Rust toolchain/target pinned by rust-toolchain.toml and run npm ci, npm run bootstrap, npm run build, npm run typecheck and npm run package. Mac LGPL FFmpeg compilation needs the dependencies described by the upstream scripts.

For a branding-only build using this unchanged native release, restore the matching generated native index.d.ts files from the VPS first. Release bundles omit these development types. They are already restored in this Mac checkout.

```sh
node apps/desktop/scripts/stage-upstream-mac-native.mjs /Applications/WeftCut.app
# If the matching generated WASM module was restored from the VPS build:
export WEFTCUT_EVAL_WASM_PREBUILT=1
npm run build
npm run typecheck
npm run gen:icons --workspace apps/desktop
cd apps/desktop
npx --no-install electron-builder --mac --arm64 --publish never
```

The packaging gates check the FFmpeg licenses/source materials and the Stich skill. Mac packages use an ad-hoc signature and are not notarized. No global macOS security setting is changed.

## Daily use

Open Stich from Applications or Spotlight. Use the stich MCP connection for Stich projects and weftcut for the official editor. Do not open the same project in both apps simultaneously. A new Codex chat may be needed to load a newly registered MCP connection.

No official preferences, credentials, recent projects or active timeline are copied into Stich. Import files or create a new project when ready. This change does not alter video-editing behavior.
