# Extract runtime-owned MP4 export with agent tools

Status: planned
Type: task
Blocked by: 03, 05; final cut acceptance after 06

## Outcome

Export the same composition to a raw-trimmed MP4 without depending on an open browser tab.

## Scope and interfaces

useExportFlow.ts, runExport.ts, managed render host, native audio/encoder/mux and job state.

## Work

- Extract reusable export orchestration; freeze revision/settings/routing.
- Reuse existing compositor in a managed render host and native audio/FFmpeg sink, with bounded backpressure.
- Expose start/read/cancel; survive tab close and report runtime interruption honestly.
- Verify staged MP4 and publish a new output name atomically; return metadata and completed checks.

## Acceptance and evidence

- Short portrait sample has correct image, sound, duration, codecs and sync.
- Closing tab, cancellation, retry, human edits during export and runtime crash do not duplicate/corrupt outputs.
- Original and existing export are preserved; final handoff gets actual playback verification.

## Context

Read [the implementation plan](../../../docs/plans/stich-in-codex/README.md) and its architecture, transcript, tool and delivery documents. Execution is not authorized by this planning ticket alone. Record findings, exact source/artifact and limitations when completed.

## Comments

Created from the completed requirements interview on 5 October 2026. No runtime work performed.
