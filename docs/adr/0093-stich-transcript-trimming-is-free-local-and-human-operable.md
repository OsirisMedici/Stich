---
status: accepted
---

# Stich transcript trimming uses free local processing and shared human/agent actions

Osiris chose a free transcript-trimming workflow that uses this Mac and open-source runtimes rather than paid recognition services. The private Stich workflow must run recognition locally, report missing assets explicitly and refuse cloud fallback. The source already contains cloud backends, so this constraint must be enforced in workflow policy rather than inferred from the presence of a local engine.

Stich remains a human-operated editor with tools for agents. Humans and AI can choose and perform cuts through the same application operations, project state and history. The output handoff is a raw-trimmed MP4; editor-specific timeline interchange is outside this first workflow. This records the product decision; runtime enforcement and the browser implementation are still pending.
