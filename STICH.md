# Stich

Stich is an open-source customization of WeftCut 0.3.0. The official WeftCut application remains available for its current editing project. Keep these two applications and their active projects separate.

| Identity | Official | Stich version |
| --- | --- | --- |
| Mac application | /Applications/WeftCut.app | /Applications/Stich.app |
| Bundle identity | dev.weftcut.desktop | com.osiris.stich |
| Profile on Mac | ~/Library/Application Support/WeftCut | ~/Library/Application Support/Stich |
| Codex MCP entry | weftcut | stich |
| Codex skill | ~/.codex/skills/weftcut | ~/.codex/skills/stich |
| Automatic upstream installation | Upstream behavior | Disabled |

The custom app has an orange film-strip S icon, Stich startup screen, window titles, About dialog and agent-setup instructions. Upstream copyright and license notices remain intact. Internal @weftcut packages, project format, protocol notifications and compatibility helper tool names are retained.

## Source locations

- Public source: https://github.com/OsirisMedici/Stich
- Clone into a directory of your choice; keep development profiles separate from your editing profile.
- Branding baseline: codex/stich-branding
- Browser/transcript MVP: codex/stich-browser-mvp
- Upstream base: v0.3.0, commit 51e5754b63dfee57a34fd5d4208bc80f4d2cc9ee

The public repository preserves the upstream base and publishes the current Stich source. No public installer release is available yet. Local operational checkout paths and credentials are not part of the public setup.

## Rebuilding

The original branding package reused unchanged native components. The browser/transcript MVP changes Rust job scheduling and proxy generation, so its primary Mac addon must be built from this source. Do not run the upstream-native staging shortcut on the MVP branch. The separate decode addon is unchanged; retain its matching release libraries and notices.

Use Node 24 or later. An isolated runtime is supported; add its bin directory to PATH for the build session.

For a fresh full source build, install the Rust toolchain/target pinned by rust-toolchain.toml and run npm ci, npm run bootstrap, npm run build, npm run typecheck and npm run package. Mac LGPL FFmpeg compilation needs the dependencies described by the upstream scripts.

For a branding-only build using this unchanged native release, restore the matching generated native index.d.ts files from a matching full source build first. Release bundles omit these development types. They are already restored in this Mac checkout.

```sh
node apps/desktop/scripts/stage-upstream-mac-native.mjs /Applications/WeftCut.app
# If the matching generated WASM module was restored from a matching source build:
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

No official preferences, credentials, recent projects or active timeline are copied into Stich. Import files or create a new project when ready. The MVP adds the browser editor and transcript operations described below.

## Browser/transcript MVP

[Stich inside Codex](docs/plans/stich-in-codex/README.md) records the accepted product plan. [MVP implementation and acceptance](docs/plans/stich-in-codex/MVP.md) describes the current implementation and observed limits. Use `open_stich_editor` through Stich's MCP connection, then open its one-use URL in Codex's in-app browser. Keep the local Stich runtime open. Speech transcript offers local recognition, linked word cuts, spelling-only corrections, undo and clip-edge adjustment. Browser Export MP4 uses the full edited timeline and the native render host.

Development uses `STICH_DEV_PROFILE` with an isolated profile only for unpackaged runs. It is not a production profile override. The current acceptance project is a separate disposable copy; existing WeftCut/Stich projects remain separate.
