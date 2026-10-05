# Verify complete Codex and manual workflows

Status: planned
Type: task
Blocked by: 06, 07, 08

## Outcome

Ensure the learning curve is small because tools and human controls cover the same journey.

## Scope and interfaces

Tool naming/coverage, WebMCP+server sessions, Stich skill/connector guidance and acceptance scenarios.

## Work

- Run the full tools-only application journey in a fresh Codex chat with the editor visible.
- Run the same journey manually; adjust one AI edit and verify undo/readback.
- Test duplicate transports, stale revision, timeout retry and page close during jobs.
- Update export guidance only after tools work; document any OS/audio activation gesture.

## Acceptance and evidence

- Actual host discovery and whole journey are recorded, not inferred from the tool catalog.
- No required editing action is silently performed by UI clicking because its tool is missing.
- Accepted jobs remain inspectable after page close; official connection/skill stays separate.

## Context

Read [the implementation plan](../../../docs/plans/stich-in-codex/README.md) and its architecture, transcript, tool and delivery documents. Execution is not authorized by this planning ticket alone. Record findings, exact source/artifact and limitations when completed.

## Comments

Created from the completed requirements interview on 5 October 2026. No runtime work performed.
