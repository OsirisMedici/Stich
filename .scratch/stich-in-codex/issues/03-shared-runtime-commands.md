# Create shared commands and renderer runtime adapters

Status: planned
Type: task
Blocked by: 01 findings; initial inventory can start earlier

## Outcome

Keep a single authoritative project while browser, desktop and agents request the same changes.

## Scope and interfaces

Renderer bridge/direct window.api inventory; TypeScript actor/host; MCP command registry and event subscriptions.

## Work

- Define RuntimePort and implement Electron/browser adapter seams for the first workflow.
- Add workspace-opening identity, monotonic revision, stale-write refusal and bounded reconnect snapshots.
- Add durable bounded request receipts for retry deduplication; retain coherent undo/history.
- Separate agent sessions/activity from editor layout so tools preserve the full timeline.

## Acceptance and evidence

- Meaningful tests cover concurrent manual changes, project switch, duplicate request and retry-after-undo.
- Both adapters route common edits through one actor with actual committed readback.
- No arbitrary IPC/FS endpoint or independently writable browser timeline.

## Context

Read [the implementation plan](../../../docs/plans/stich-in-codex/README.md) and its architecture, transcript, tool and delivery documents. Execution is not authorized by this planning ticket alone. Record findings, exact source/artifact and limitations when completed.

## Comments

Created from the completed requirements interview on 5 October 2026. No runtime work performed.
