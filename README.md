<p align="center">
  <img src="apps/desktop/src/renderer/public/icons/icon.png" alt="Stich" width="112" height="112" />
</p>

<h1 align="center">Stich</h1>

<p align="center">Edit your video by editing its transcript. Work by hand or with your AI agent in the same timeline.</p>

Stich is an open-source video editor based on [WeftCut](https://github.com/WeftCut/WeftCut). Its first MVP focuses on turning a recorded talking video into a trimmed MP4 for your next editor. Open the full timeline beside Codex chat, transcribe locally, cut words and refine the clip boundaries. Human controls and agent tools edit the same project.

## What works today

- Create and open local projects, import footage and arrange the timeline.
- Open the editor in a browser using a one-use localhost launch URL.
- Run Whisper Base through whisper.cpp on your own Mac. Model and runtime downloads are optional setup steps; recognition runs locally.
- Read a timed transcript, select words and cut their linked video and audio together.
- Correct spelling without changing timing. Hindi recognition has an editable Roman-letter display.
- Play near a cut, adjust clip edges, undo edits, save and export H.264/AAC MP4.
- Let an existing AI agent use server MCP or the browser's WebMCP tools, alongside manual editing.

No paid transcription service or bundled AI agent is required for this workflow. Your agent account or subscription remains separate. The inherited editor also contains optional provider integrations; the Stich transcript workflow uses the local engine.

## Current status

The first MVP has been installed and checked on an Apple Silicon Mac. Build, typecheck, focused regressions, local recognition, linked cuts, undo, saving and short MP4 export were checked. [MVP evidence and limits](docs/plans/stich-in-codex/MVP.md) records the measurements.

This repository currently distributes source. There is no public Stich installer release yet. Windows and Linux are inherited development targets, with no Stich acceptance claim. Smooth playback under load and Hindi/English code-switching accuracy need further testing. First-use media preparation can take time. Undo and checkpoints last for the open project session; saved edits and transcripts persist. Transcription/export jobs do not resume after quitting the app.

Stich retains Electron and the existing native media engine. The installed Mac app is about 643 MB. This MVP is not a smaller runtime rewrite.

## Build from source

Use Node 24+, the Rust toolchain pinned in `rust-toolchain.toml`, and the platform build tools in [setup](docs/setup.md). A full bootstrap builds both native addons and fetches FFmpeg dependencies. Allow several GB of disk space for build outputs and packaging.

```sh
git clone https://github.com/OsirisMedici/Stich.git
cd Stich
npm ci
npm run bootstrap
npm run build
npm run typecheck
npm run dev
```

Run `npm test` for the unit suite and `npm run package` to build an installer locally. Packaging enforces FFmpeg license/source and bundled skill checks. Rebuild the primary Rust addon from this branch; do not substitute the upstream addon for the MVP's changed media jobs. [Stich setup](STICH.md) has further details.

## Use with Codex

1. Start the local Stich app. Configure its MCP connection using the agent setup in Settings.
2. Ask Codex to call `open_stich_editor` and open the returned one-use URL in its in-app Browser. Keep Stich running.
3. Create or open a project and place a video on the timeline.
4. Open Speech transcript, select the clip, install the local speech engine once and transcribe.
5. Click a word and shift-click the last word of a range. Cut selected words removes that footage and closes the gap. Use Undo / restore to recover a cut during this session.
6. Export to a new MP4 filename. Existing outputs are refused.

A fresh browser launch URL is needed after restarting Stich. The [bundled agent skill](skills/stich/SKILL.md) documents the tools and their constraints.

## How it works

The Electron process hosts project state and a scoped localhost browser service. React/TypeScript implements the editor. The existing project actor applies both human and agent edits. Rust jobs handle local speech preparation, previews and FFmpeg work. Browser preview uses WebCodecs; export uses the native renderer and original media where supported.

[Architecture](docs/plans/stich-in-codex/ARCHITECTURE.md), [transcript model](docs/plans/stich-in-codex/TRANSCRIPT-MODEL.md), [tool contracts](docs/plans/stich-in-codex/TOOLS.md) and [continuation handoff](docs/STICH_HANDOFF.md) describe the changes. Team/VPS rendering is future work; this MVP runs on one Mac.

## Attribution and license

Stich is maintained by [Osiris Medici](https://github.com/OsirisMedici). WeftCut was created by [UncleChair](https://github.com/UncleChair). Stich starts from WeftCut v0.3.0, commit `51e5754b63dfee57a34fd5d4208bc80f4d2cc9ee`. Internal `@weftcut` package names and the compatible project format remain.

The application source uses the [MIT license](LICENSE), with upstream copyright preserved. Bundled FFmpeg components have separate GPL/LGPL terms. Keep [third-party notices](THIRD-PARTY-NOTICES.md) and the [licensing requirements](docs/licensing.md) when distributing builds. [The original README](README.upstream.md) documents inherited editor features; the status above governs Stich support.
