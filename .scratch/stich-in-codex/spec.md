# Stich inside Codex

Status: planned; product interview complete, implementation not started.

The durable implementation plan is [README.md](../../docs/plans/stich-in-codex/README.md); the interview history is [SESSION.md](../../docs/plans/stich-in-codex/SESSION.md).

Build a human-operated full timeline beside Codex on this Mac, with tools for the same complete project/import/transcript/cut/play/save/MP4 workflow. Recognition is free/local; English and Hindi code-switching is supported, Hindi displayed in Roman letters. Correct text changes spelling only. Cutting, audition, boundary adjustment, restore and undo change/recover footage. Editorial choices are made in each agent conversation; no compulsory trimming recipe. Usable-transcript target is approximately recording duration (real-time factor ≤1), subject to quality/speed benchmarks. Team/VPS rendering and creative finishing are deferred.

Keep TypeScript/React/project actor and Rust/media services. Add typed browser adapters, scoped localhost hosting, source transcript persistence, shared operations/tools and runtime-owned export. Follow the detailed architecture, transcript and tool contracts in the plan directory. First prove browser playback/audio and local multilingual recognition/timing on this Mac. No prototype is a shipped feature.

One numbered ticket per task is under `issues/`; dependencies and acceptance are indexed in [DELIVERY.md](../../docs/plans/stich-in-codex/DELIVERY.md). This feature's spec/tickets are explicitly tracked for durable private handoff without changing the global scratch ignore rule. Product review precedes implementation.
