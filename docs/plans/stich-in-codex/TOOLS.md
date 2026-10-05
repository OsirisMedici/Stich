# Shared human and agent capabilities

Status: proposed contracts. Names below are capability descriptions, not a promise that a particular tool already exists. Inventory and reuse current names before adding tools; respect ADR 0074 and the existing `read_project` pattern.

## Coverage

| Capability | Human control | Agent operation and observable result |
| --- | --- | --- |
| Runtime readiness | Launch/connect status, open editor | Discover/start through local launcher integration; return active port, capabilities and failures |
| Create/open/list projects | Project chooser and recent projects | Scoped list/open/create; return project/workspace identity, revision and prepared state |
| Find/import media | File picker, folder search, media pool | Search an explicit root; probe/import chosen file; return media IDs and readiness/job handles |
| Manage/move folders | Project organizer/move command | Rename/move managed project folder; verify references and recovery before completion |
| Add to timeline | Drag/drop and add action | Place known media at a validated track/time; return linked clip IDs |
| Read timeline/transcript | Visible panels and selections | Bounded reads with stable IDs, source/timeline mapping and timing provenance |
| Local transcription | Transcribe action, model readiness and progress | Start/cancel/read local job; return usable source transcript and quality metadata |
| Correct text | Separate correction control | Patch selected source-span display spelling; return changed text, unchanged media ranges |
| Cut transcript selection | Select words and Cut | Resolve occurrences, dry-run/apply common linked edit; return new revision/cut IDs/duration |
| Adjust/restore | Trim handles, nearby numeric controls, restore | Set/extend cut edge or restore known removed interval; return affected source/timeline ranges |
| Preview | Play/pause/seek, audition boundary | Request playback/seek/audition; return requested and observed state, readiness or activation requirement |
| Inspect media/output | Preview, waveform and output inspection | Source/composition frames, bounded audio audition and artifact metadata; report rendering errors |
| Undo/checkpoint/save | Undo/redo and save state | Existing history operations plus flush/checkpoint; return persisted completion, not just queued autosave |
| Export | Export panel, progress/cancel, reveal output | Start/read/cancel runtime job; return verified MP4 artifact and frozen source revision |

Every included command has a human entry point and a common application implementation. No hidden agent-only edit semantics. Playback and frame inspection are complementary: a screenshot does not prove sound or complete-video correctness.

## Read and mutation envelopes

Mutations carry an active workspace-opening identity, expected monotonic revision and caller-generated request ID, plus typed arguments. Prefer stable media/clip/word occurrence IDs over names or transient selection. Validate limits and relationships in the runtime, not only in the UI/tool schema.

Committed results identify the operation, workspace, before/after revision, actual changed IDs and any job/artifact. Concrete errors include stale revision, closed/different workspace, unsupported arrangement, missing source/model, locked layer, invalid boundary, authentication failure and interrupted job. Do not return success for a queued operation before distinguishing acceptance from completion.

Persist a bounded mutation receipt journal outside user undo history, so a timeout/restart retry can recover its committed result. The same request ID with different arguments is a conflict; the same ID/arguments never performs the edit twice. A retry after undo returns the old receipt with its revision, not a claim that the edit is still present. Re-read current state. Dry-run is side-effect-free and apply revalidates current revision.

Reads are bounded by composition/source/time range and pagination. Large transcripts use chunks with stable anchors. Export/transcription return job handles immediately; job reads/events contain stages, progress when meaningful, elapsed time, cancellation and result/error. Avoid tool calls that block for ten minutes or poll every frame. Reconnect takes a fresh snapshot and can still inspect existing accepted jobs.

## Transport and session behavior

WebMCP registers a curated set in the editor's top-level page and adds page selection/viewport context. It calls the same authenticated local operations as the human browser UI. Register tools only when connected and revoke them on disconnect; do not leave stale project handles callable. Current Codex page discovery must be verified in the installed host.

Server MCP retains durable runtime/job access independent of page lifetime. Reuse its current auth/discovery and tool naming. A shared operation/receipt layer prevents duplication between page and server clients. Do not create two editing locks or layout transitions for one agent because both transports are present. Test history grouping and manual edits explicitly; a work session is not an exclusive write lease.

The Stich skill should teach capabilities, readiness and verification, not prescribe an editorial strategy. It currently directs export to the UI; update that guidance only when an export tool actually works. Keep the official WeftCut skill/connection separate. Document connecting/reloading/new-chat discovery behavior honestly.

## Whole-journey tool acceptance

In a fresh Codex chat, open the editor, create a disposable project, find/import the sample, add it, transcribe, read/correct/cut/adjust/restore, play, save and export using application tools. Verify the visible timeline and persisted results after each meaningful phase. Repeat the journey manually with the same capabilities. UI interaction needed for an actual browser/OS permission or audio gesture must be reported; it must not conceal a missing editing tool.

Close/reopen the browser during recognition/export, retry after simulated timeout, edit manually during an agent read, switch projects and reconnect both transports. Results must remain correct or give explicit conflicts. Tool count alone is not acceptance.
