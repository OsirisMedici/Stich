# Stich browser and transcript MVP

Implementation branch: `codex/stich-browser-mvp`. This is the first Mac MVP. Broader delivery gates in DELIVERY.md remain open; the checks below apply to this Mac and recording.

## Experience

Open the full editor beside Codex chat using `open_stich_editor` and its one-use localhost URL. The existing native Stich process owns the project; browser controls and agent tools edit that same project. Open Speech transcript, select a video clip, install local Whisper Base once and transcribe. Click a word, or shift-click a consecutive range. Cut removes linked picture and audio with ripple in one undo step. Correct spelling changes display text only. Play nearby and the 0.1-second clip-edge controls support auditioning and refining joins. Export MP4 produces the complete edited timeline on this Mac.

The MVP handles normal-speed clips. It does not create captions, translate speech, impose editorial decisions or upload footage. Hindi words returned by recognition have an editable Roman display. Mixed-language recognition accuracy requires listening and review; a language selector offers automatic, English and Hindi/Hinglish recognition.

## What changed

- Keep Electron, React/TypeScript, Pixi, the TypeScript project actor and Rust/FFmpeg. No framework migration, paid speech backend or VPS service.
- A scoped Express host shares the MCP localhost port. One-use launch grants become HttpOnly same-origin browser sessions. Selected/project media and cache files stream through range requests. The page never receives the MCP bearer.
- `src/main/stich/service.ts` owns speech artifacts, guarded word edits and local jobs. Human controls, WebMCP and MCP call the same operations. Workspace epochs, revisions and persisted retry receipts protect transcript edits.
- Immutable source-word JSON lives in `Transcripts/`. Clip metadata points to it and stores spelling corrections. Splits inherit references; timeline occurrence times derive from each surviving clip's source range. Save As copies referenced artifacts before publishing the project.
- Browser decoding uses the existing WebCodecs path. Native textures are not browser transports. The original bridges startup when decodable; the browser switches to its ready lightweight proxy for editing. Export reads originals through native decode when available, independently of preview proxies.
- Rust queues audio conform immediately on video import/open, independently of the long video-proxy chain. A single audio worker is separate from the two video workers. Recognition extraction shares the audio worker. Conform's existing in-flight guard avoids duplicate builds.
- Preview proxies use the Mac hardware encoder with a software fallback. Both proxy recipes preserve sensor axes with `-noautorotate`, so portrait layer transforms are applied once. Quick-proxy q5 and full-proxy format 8 invalidate the earlier rotated recipe.
- Reopening still clears serialized preview pointers, but retains a q5 cache whose filename matches the source hash. The native job adopts its own non-empty, recipe-keyed cache instead of encoding the whole recording again. Legacy quick-proxy recipes keep their old invalidation behavior.
- Linked imported A/V tail padding is recognized on the video frame grid when trimming. Deliberately unequal linked edges still retain their relative timing; sub-frame differences that snap to the same video edge follow together.
- Export stays in the native runtime renderer, with an editing barrier, cancellation, a unique staging output, metadata verification and no overwrite of existing outputs. Closing the browser does not cancel it; quitting Stich does.

## Evidence recorded on 2026-10-05

Disposable project: `Stich MVP Demo 2026-10-05`. The original projects and recordings were not edited.

| Check | Observed result |
| --- | --- |
| Local speech benchmark | 633.13 seconds of source, 1,532 timed words, Whisper Base/whisper.cpp, 113.501 seconds elapsed, RTF 0.179. One run, not a reliable average. |
| Speech language quality | Automatic result mostly English. Hindi/code-switching accuracy and audible word-boundary quality remain unvalidated. |
| Shared operations | Tests cover linked A/V ripple cut, one-step undo, spelling-only correction, stale refusal, retry deduplication, inherited references, export editing barrier and retime refusal. |
| Save As | Test checks copied immutable artifact bytes and collision refusal. |
| Audio regression | Holding both video permits reproduced blocked audio before the fix. The same native regression passes with the independent audio worker. |
| Actual Play | The Codex browser's first Play advanced its clock without the previous audio timeout. MCP Play returned observed `playing: true`, no error, in the editor's 250 ms acknowledgement window. This excludes tool/transport round-trip latency. |
| Direct media | A startup race skipped the original-decoding probe when App's summary arrived before its separate store. The hook regression fails before the fix and passes after. The Codex browser then returned `ok` for the original 4K HEVC recording, showed upright frames and played while proxy generation was still running. |
| Playback quality | Moving picture and advancing clock observed, with late/dropped frame counters under current machine load. This is not yet a proven smooth 30/60 fps performance budget. |
| Packaged recognition | A fresh 30-second selection transcribed locally into 81 timed words in 15.083 seconds, using the installed app and its own local model. |
| Packaged cuts and undo | Three consecutive words removed; both surviving video clips retained transcript references. Undo restored the cut, prior transcript and full 10:33 A/V spans. |
| Real MP4 exports | Development runtime: 30-second 608×1080 H.264/AAC MP4 in 43.085 seconds. Installed runtime: a frame-snapped word cut produced 29.016667 seconds in 108.534 seconds during concurrent builds. Both ffprobe checks found video and audio. |
| MP4 playback | The 30-second MP4 played upright in Codex's in-app browser, with `paused:false`, `muted:false`, readyState 4 and advancing time. Audio decode/volume analysis confirmed a non-silent AAC stream; subjective listening remains a human check. |
| Restart | Saved timeline and all 1,532 original words reopened in the installed app. Existing actor undo/checkpoints reset on project reopen; tool descriptions now state that limitation. |
| Regression checks | TypeScript typecheck and production build passed. 136 linked-trim/service tests passed; final focused browser/startup/transcript/export-setting/instruction selection passed 33 tests. Native audio-worker and actual rotated-media proxy regressions passed before packaging. |
| Warm-cache regression | Retention test failed before the fix. The updated persistence, host and decoder selection suites passed 66 tests. Serialized preview pointers remain cleared; the source-specific q5 file remains reusable. |
| Final warm open | Project-open tool round trip 0.276 seconds in one run; cached q5 inode, mtime and bytes unchanged. The visible Codex editor reported `webcodecs on proxy`, drew upright moving picture and acknowledged seek/play with `playing:true`, no error. This is not a cold-import or whole-browser-load latency guarantee. |
| Browser transport checks | No-session API 401, wrong origin 403, one-use grant exchange 200/replay 401, authenticated tool catalog 200, originless mutation 403, arbitrary file refusal 400 and registered media range 206. |
| Human cut controls | Clicking a word and shift-clicking the range endpoint removed linked picture/sound. The transcript panel's Undo restored the full 633.13-second source spans. |

## Current limits and next acceptance

First-use codec conversion is not instant for an original this browser cannot decode. This recording can decode directly following the startup-race fix. The browser needs one initial Play gesture if its audio policy requires it. Transcript/export job state currently lives in the running process; app restart does not resume jobs. Undo and named checkpoints also last for the current open project session. Saved edits, immutable transcripts and periodic Backups persist. Export uses the existing desktop renderer rather than a separate headless worker. Browser export offers full-timeline H.264/AAC MP4 and a height selector; advanced native formats/range settings remain in the desktop editor. Some advanced desktop features have no browser transport. Team/VPS hosting, cold/warm CPU-memory measurements, corrupt-artifact recovery and cross-volume interruption tests remain later gates.

## Installed artifact and recovery

`/Applications/Stich.app`, private 0.3.0 build. Final `Contents/Resources/app.asar` SHA-256: `259cb735d381745b78467b5eabcff774f5977277c4a8b773c0658d0e2108e6d0`.

The initial full electron-builder package passed licensing/skill gates and deep strict codesign verification. A later complete repack hit ENOSPC on this nearly full Mac. The final app reuses that verified Electron/native bundle, with the final production `out/` packed by the official ASAR tool. Its main bundle was compared byte-for-byte with build output; the embedded ASAR header integrity was refreshed, licensing/skill gates rerun, and the root ad-hoc signature regenerated and deep-strict verified. No Gatekeeper or browser security protection was disabled. The previous installed branding app remains in a separately preserved local rollback folder; its earlier release remains separately preserved. Official WeftCut was not changed.

Generated Cargo outputs were cleaned to recover build space. Failed generated package folders and a partial install are preserved outside the source checkout. Recordings, project folders and local models were retained. App size remains roughly 643 MB because this MVP retains the existing Electron/runtime bundle; it is not a new lightweight installer architecture.

The disposable demo has a 60 fps project canvas over 30 fps phone footage. Create future projects with an explicit `{num:30,den:1}` rate when matching this recording; the existing rate locks after clips are placed.

## Try this build

Keep Stich running and use the editor tab beside Codex. The prepared demo contains the full original recording and editing transcript. Press Play; open Speech transcript, click a word and shift-click the last word of a range, then Cut selected words. Use Undo / restore immediately to recover that test cut. Correct spelling edits the displayed word only. The clip-edge buttons adjust boundaries by 0.1 seconds. File → Export opens the browser's MP4 controls. Give each export a new filename; existing outputs are refused.

Codex can use the live page's WebMCP tools or Stich's server MCP. On a fresh session, call `open_stich_editor` and open its one-use URL in the in-app browser. After an app restart the previous browser session expires and needs a fresh launch URL. Keep the local app running until transcription/export finishes. The installed Codex Stich skill was updated for these tools, with the previous skill preserved separately.
