---
status: proposed
---

# Editing transcripts retain source word identities

Persist source speech words and timing separately from their surviving clip occurrences on the timeline. Keep Roman display/spelling corrections separate from footage changes and commit corrections/cuts through project history. This costs a schema migration and explicit occurrence mapping, but avoids losing restoration data or invalidating selections after ripple edits, clip reuse and Romanization. A destructively rewritten transcript or caption-layer representation cannot reliably support the agreed editing workflow. Detailed contract: [TRANSCRIPT-MODEL.md](../plans/stich-in-codex/TRANSCRIPT-MODEL.md).
