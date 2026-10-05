# Prove local English/Hindi recognition and cut timing

Status: claimed
Type: research
Blocked by: None

## Outcome

Select a local pipeline from measured speech accuracy, Roman display, audible cut timing and usable-transcript time.

## Scope and interfaces

Existing native speech integration, whisper_cpp sidecar/build, normalized transcript parser and local model readiness.

## Work

- Compare multilingual Base/Small candidates on reviewed English, Hindi, Hinglish, names, repetitions, noise and pauses.
- Prototype local Romanization retaining source-word anchors; review display quality with spelling correction.
- Time full ready-to-edit pipeline, stage timings, cold/warm runs and memory; evaluate alignment only when measured timing needs it.
- Verify runtime/model/dependency licenses independently and missing-local-assets behavior.

## Acceptance and evidence

- A representative ten-minute run targets real-time factor ≤1; actual results and sample count are recorded.
- Listen to selected cuts; report boundary errors and recognition issues, not only parser success.
- No cloud audio upload/fallback; any missed quality/speed target becomes an explicit tradeoff for review.

## Context

Read [the implementation plan](../../../docs/plans/stich-in-codex/README.md) and its architecture, transcript, tool and delivery documents. Execution is not authorized by this planning ticket alone. Record findings, exact source/artifact and limitations when completed.

## Comments

Created from the completed requirements interview on 5 October 2026. No runtime work performed.
