# Proposed architecture and source map

Status: recommended design, subject to the playback and recognition gates in [DELIVERY.md](DELIVERY.md). Paths below are relative to the repository root. See [the current architecture guide](../../stich-architecture-guide.md) for existing behavior.

## Runtime boundary

Introduce a typed `RuntimePort` used by the renderer for project reads/commands, jobs, media access, playback coordination and scoped file selection. Keep separate Electron and browser adapters. Inventory direct `window.api` uses in addition to the existing bridge wrappers; replace them deliberately rather than publishing a general-purpose IPC endpoint or faking the entire preload object in the page.

Relevant seams:

- `apps/desktop/src/renderer/bridge/ipc.ts`, `events.ts` and companion wrappers.
- `apps/desktop/src/main/state/actor.ts`, `ts-actor-host.ts`, `workspace-orchestrator.ts` and `persistence.ts`.
- `apps/desktop/src/main/mcp/index.ts`, `bind.ts` and `auth.ts`.

The runtime hosts the current TypeScript project actor. Preserve its serialization, validation, frame/sample snapping and history. Add a workspace-opening identity and monotonic revision so an asynchronous operation cannot accidentally apply to a different open project. History grouping/locks alone are not mutual exclusion for all writers. Browser tools, server tools and manual controls share application commands and revision checks.

Expose current committed state and events with bounded subscriptions and reconnect snapshots. Inactive tabs must stop preview demand. Reconnection identifies the workspace/revision; it never assumes the last browser snapshot is authoritative. Server and page adapters share operation identity so connecting twice does not duplicate a work session or accepted job. Starting agent work preserves the full timeline, revising the private layout behavior described in ADR 0065 explicitly.

## Localhost application host

Extend the existing loopback host rather than introduce another production service. Proposed routes:

| Route | Purpose |
| --- | --- |
| `/ui/` | Version-matched browser editor assets |
| `/api/v1/…` | Allowlisted typed commands, reads and jobs |
| `/events` | Authorized state/job events with reconnect handling |
| `/media/{assetId}` | Scoped source/proxy/audio reads with HTTP range support |
| `/mcp` | Existing authenticated MCP endpoint |

Exact route names are implementation details. Keep the host on `127.0.0.1` with current dynamic-port discovery. One launcher starts or reuses a matching runtime, reports readiness and gives Codex a current editor URL. Prevent a second instance from writing the same project.

Use a short-lived one-time launch grant exchanged for a scoped, HttpOnly browser session cookie. Consume it and remove it from the address bar; do not expose the MCP bearer token to page JavaScript, store it in localStorage or leave reusable credentials in URLs/logs. Validate Host/Origin, same-origin credentials and CSRF protections for mutations; use no wildcard CORS. Test the actual host's navigation/session behavior before finalizing this mechanism.

Filesystem access is local but still scoped: project operations resolve known workspace identities; file discovery uses a user-selected or explicitly requested root. Native pickers remain available for humans. Browser import transfers a file using a bounded upload when needed, rather than trusting a browser filename as an absolute path. Media IDs resolve registered files and derivatives, never arbitrary HTTP paths. Support range reads, cancellation and bounded upload sizes. No recursive full-disk indexing is needed.

Moving a project folder is a runtime operation: flush/checkpoint, suspend writes, move within a volume or copy/verify across volumes, reconcile references, reopen and only then confirm completion. External media remains external and must be validated. Interruption must leave at least one usable copy and an actionable recovery state. AI and people receive the same result.

## Browser preview: first gate

Today's Standard decoder uses Electron-specific shared textures/message ports. Those cannot be handed to a normal browser page unchanged. Inspect:

- `apps/desktop/src/preload/index.ts`.
- `apps/desktop/src/renderer/render/decoder/transports/GpuTransport.ts` and `SwTransport.ts`.
- Existing Lite/WebCodecs path, `Compositor.ts`, `CompositionNode.ts` and preview audio modules.

First prototype the existing Lite/browser decode path with a compatible local source or quick proxy, shared compositor and HTTP range media. Use prepared canonical audio through a browser-compatible, session-owned audio adapter, with chunked reads, a shared playback clock and stale-read cancellation. Compare 540p/720p preview options on real material; export does not use the reduced quick proxy as its final source.

Test portrait HEVC/MOV, rotation, audio, cuts, seeking and existing timeline overlays. Browser audio activation may require an initial human gesture. Distinguish a tool's requested playback state from confirmed audible output; record the installed host's actual behavior instead of promising no clicks under every circumstance.

Measure dropped/late frames, seek latency, A/V drift, memory and CPU on the M2 with the competing official editor closed. If this route is inadequate, compare a bounded binary native frame transport on the same fixture before adopting it. Do not move full-resolution frames into JSON/base64 tool responses. Preserve ADR 0082 buffer ownership and ADR 0087 audio-session cancellation.

## Local speech and Romanization

Reuse `apps/desktop/native/src/speech/` and the existing `whisper_cpp` sidecar/build configuration. Recognition runs as a cancellable local job, with explicit engine/model readiness and resources released afterward. One inference job initially avoids competing models exhausting this Mac.

Normalize engine times into original source coordinates once. Keep timing provenance from `native/src/speech/transcript.rs`; interpolated cue times and engine word times are estimates with different reliability. Use a local alignment improvement only if measured boundary quality requires it and its license/resource cost fits.

Romanization is a separate local adapter. Convert recognized Hindi script to readable Roman Hindi while leaving English and source anchors intact. Evaluate a license-compatible transliteration implementation and a small reviewed vocabulary; do not silently translate, rewrite content or retokenize away timing relationships. Human spelling corrections are stored as overrides. See [TRANSCRIPT-MODEL.md](TRANSCRIPT-MODEL.md).

Source inspection correction: older ADR 0036 describes availability-based fallback, but the inspected `select_backend` in `apps/desktop/native/src/speech/mod.rs` filters the explicitly preferred backend and does not implement that transcription fallback. Some legacy types/comments still mention `auto`. Enforce local-only policy across every Stich transcription entry point and test unavailable-model behavior; do not diagnose current behavior from the older ADR alone. Existing cloud/TTS code is not required for this workflow.

## Export job extraction

Current `apps/desktop/src/renderer/app/useExportFlow.ts` owns orchestration and panel lifecycle; `render/worker/runExport.ts` renders frames and communicates with native sinks. Extract an application `ExportJob` interface and move job ownership to the runtime. Reuse the compositor in a managed hidden Electron render host initially, plus the existing Rust audio mix and FFmpeg encoder/mux path. A pure FFmpeg concatenate command is not a substitute for composition rendering.

Freeze the accepted project revision, output settings and source-routing table. Report preparation, render, audio, encode/mux and verification stages. Reloading/closing the browser does not cancel an accepted job; explicit cancellation does. Runtime termination must mark an interrupted job, clean/recover partial output and never report success. On restart, recover enough job metadata to explain the interruption rather than blindly resume frame rendering.

Initial handoff: MP4 with broadly usable H.264/AAC, retaining the chosen composition size, orientation and FPS unless the user selects another preset. Evaluate output quality on a short sample first. Stream frames with backpressure; start one render worker only when needed. Write a temporary output and atomically publish a new filename after successful verification. Never silently overwrite the original or an existing export. Job result includes path, duration, dimensions, codec, source revision and checks actually completed.

## Technology and deployment boundaries

Keep the repository's pinned Electron/React/TypeScript/Vite/Pixi/Rust dependencies unless a demonstrated blocker needs an upgrade. Do not convert the project actor to Rust or move all rendering to a new engine for this outcome. No hosted database, remote rendering, account service or bundled second AI is needed.

Browser UI is a versioned build target; the packaged local runtime serves matching assets and native APIs. Retain Electron UI compatibility during migration. Native/Rust schema/interface changes require a genuine matching Mac native build. The branding-only helper that reuses official native binaries is not valid for changed native source. Preserve separate official/private bundle IDs, profiles, credentials and project copies.

Future VPS/team support can replace transport and job execution adapters, but would require distinct authentication, file transfer, concurrency and licensing/distribution work. These boundaries preserve that option without building it now.
