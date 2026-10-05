# Persist source transcripts and cut/correction state

Status: planned
Type: task
Blocked by: 02, 03

## Outcome

Preserve transcript identity and recovery through repeated cuts, spelling corrections and clip reuse.

## Scope and interfaces

Project model/serialize/migrate/persistence, Rust state mirrors and source transcript artifacts.

## Work

- Implement the source/occurrence/correction/cut model in TRANSCRIPT-MODEL.md.
- Add next-schema migration from current v3 with backup and matching native mirrors.
- Stage immutable transcript artifacts atomically; commit references and corrections through actor history.
- Project surviving words through existing time mapping; explicitly limit unsupported retime/group arrangements.

## Acceptance and evidence

- Old fixtures upgrade; save/reopen and interrupted-write recovery reproduce the project.
- Duplicate clip, split/ripple, Roman display span and correction anchors remain correct.
- Correction leaves media unchanged; incomplete/missing artifact produces a recoverable error.

## Context

Read [the implementation plan](../../../docs/plans/stich-in-codex/README.md) and its architecture, transcript, tool and delivery documents. Execution is not authorized by this planning ticket alone. Record findings, exact source/artifact and limitations when completed.

## Comments

Created from the completed requirements interview on 5 October 2026. No runtime work performed.
