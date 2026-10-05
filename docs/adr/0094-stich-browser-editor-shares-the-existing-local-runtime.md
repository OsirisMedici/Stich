---
status: proposed
---

# Stich's browser editor shares the existing local runtime

For the first Mac/Codex workflow, serve a full browser editor from the existing packaged Electron runtime and route human, WebMCP and server MCP commands through one TypeScript project actor. This reuses native media services and the compositor rather than rewriting the engine or maintaining a separate web timeline. Browser media and audio require measured adapters; export becomes a runtime-owned job using a managed rendering host. This retains Electron's footprint and is conditional on the installed-browser feasibility gate. A standalone server/runtime extraction and VPS execution are deferred.
