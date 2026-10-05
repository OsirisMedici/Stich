# Deliver transcript cuts, spelling correction and boundary controls

Status: planned
Type: task
Blocked by: 04, 05

## Outcome

Let humans and agents trim spoken video from the transcript and fix imperfect joins.

## Scope and interfaces

Transcript panel and common cut/correction/adjust/restore mutations; linked trim/ripple logic.

## Work

- Add distinct Correct text and Cut selection controls and tools.
- Resolve occurrence IDs to source spans; dry-run and commit linked A/V split/delete/ripple atomically.
- Add selection highlighting, nearby audition, boundary adjustment, restore and undo.
- Refuse locked/ambiguous/unsupported arrangements before writing; retain full timeline access.

## Acceptance and evidence

- English/Hindi cuts, duplicated sentence, multiple ripple edits, silence and source-bound adjustments are verified.
- One undo restores linked picture/sound/transcript; manual adjustment of AI edits works.
- Listen to cuts for clipped speech; spelling-only changes do not alter exported video duration/content.

## Context

Read [the implementation plan](../../../docs/plans/stich-in-codex/README.md) and its architecture, transcript, tool and delivery documents. Execution is not authorized by this planning ticket alone. Record findings, exact source/artifact and limitations when completed.

## Comments

Created from the completed requirements interview on 5 October 2026. No runtime work performed.
