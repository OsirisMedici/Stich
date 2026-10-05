# Deliver the full browser editor and scoped local host

Status: planned
Type: task
Blocked by: 01, 03

## Outcome

Show a real full editor beside Codex with secure local media and page tools.

## Scope and interfaces

Existing Express/MCP host, browser build, runtime adapters, auth, launcher and media/events.

## Work

- Serve version-matched editor/API/media/events from the loopback runtime.
- Implement one-time browser-session grant, scoped cookie, Host/Origin/CSRF checks and bounded media range/upload access.
- Launch/reuse runtime, retain full timeline, connect state/events and prototype-approved picture/audio.
- Register curated top-level WebMCP adapters with connected page/workspace context.

## Acceptance and evidence

- Installed host discovers actual tools; manual editor reads/changes the saved project.
- Reconnect/reload, stale handles, asset path traversal and unrelated-origin mutations are tested.
- Preview is measured on real footage; browser activation limitation is documented.

## Context

Read [the implementation plan](../../../docs/plans/stich-in-codex/README.md) and its architecture, transcript, tool and delivery documents. Execution is not authorized by this planning ticket alone. Record findings, exact source/artifact and limitations when completed.

## Comments

Created from the completed requirements interview on 5 October 2026. No runtime work performed.
