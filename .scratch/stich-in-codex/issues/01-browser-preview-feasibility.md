# Prove browser preview and audio on this Mac

Status: planned
Type: prototype
Blocked by: None

## Outcome

Prove that the actual Codex browser can preview the main recording before committing to a full browser editor.

## Scope and interfaces

Existing renderer bridges, Lite/WebCodecs decoding, compositor, media protocol, native transports and preview audio.

## Work

- Build a disposable spike with a real typed adapter and scoped range media, not a mocked preload.
- Try compatible original/proxy picture with session-owned canonical audio; record initial audio gesture behavior.
- Compare portrait orientation, cut playback, seeking, cancel/reload, 540p/720p preview and measured resource use.

## Acceptance and evidence

- Usable picture and sound in the installed in-app browser on M2/8 GB.
- Record source, peak memory/CPU, seek latency, dropped/late frames and A/V drift.
- If inadequate, document native binary transport comparison and revise the recommendation before ticket 05.

## Context

Read [the implementation plan](../../../docs/plans/stich-in-codex/README.md) and its architecture, transcript, tool and delivery documents. Execution is not authorized by this planning ticket alone. Record findings, exact source/artifact and limitations when completed.

## Comments

Created from the completed requirements interview on 5 October 2026. No runtime work performed.
