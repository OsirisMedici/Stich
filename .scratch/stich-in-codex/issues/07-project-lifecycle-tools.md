# Complete projects, file import and folder management

Status: planned
Type: task
Blocked by: 03, 05

## Outcome

Make the complete project/file journey usable from chat and normal controls.

## Scope and interfaces

Workspace orchestration, project/file discovery, import jobs, save/checkpoint and managed folder operations.

## Work

- Inventory/reuse existing tools; add missing create/open/list/find/import/place/save operations only where needed.
- Scope discovery to requested roots and identify preparation readiness per job.
- Implement rename/move with checkpoint, reference verification and interruption-safe same/cross-volume handling.

## Acceptance and evidence

- Human and agent create/import/place/save/reopen a disposable project with persisted readback.
- External media references and moved folders remain valid or return actionable errors.
- Interrupted move retains a usable copy; no edits to official WeftCut profile/project.

## Context

Read [the implementation plan](../../../docs/plans/stich-in-codex/README.md) and its architecture, transcript, tool and delivery documents. Execution is not authorized by this planning ticket alone. Record findings, exact source/artifact and limitations when completed.

## Comments

Created from the completed requirements interview on 5 October 2026. No runtime work performed.
