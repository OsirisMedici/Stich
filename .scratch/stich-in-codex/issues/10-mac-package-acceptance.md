# Build and accept the packaged Mac product

Status: planned
Type: task
Blocked by: 09

## Outcome

Ship a usable matching Mac app/browser/runtime and measured rough-cut handoff.

## Scope and interfaces

Pinned toolchain, genuine native/WASM build, private package identity and release/rollback evidence.

## Work

- Build changed native components on Mac; do not reuse official addons when native source changed.
- Complete required license/package gates and preserve private/official profiles and originals.
- Run packaged whole journey on M2/8 GB with representative recording; measure wait/edit/handoff and resource use.
- Record exact commit/package/model, full MP4 playback, limitations and pre-migration rollback assets.

## Acceptance and evidence

- Fresh packaged app works through human controls and Codex tools on this Mac.
- Usable-transcript target and output quality are measured; unmet targets are disclosed.
- Release handoff explains how to use/test and recover; no public release or VPS deployment implied.

## Context

Read [the implementation plan](../../../docs/plans/stich-in-codex/README.md) and its architecture, transcript, tool and delivery documents. Execution is not authorized by this planning ticket alone. Record findings, exact source/artifact and limitations when completed.

## Comments

Created from the completed requirements interview on 5 October 2026. No runtime work performed.
