# Editing transcript and cut semantics

Status: proposed persistence/command contract for the settled product workflow. Terminology lives in [CONTEXT.md](../../../CONTEXT.md). A transcript is speech information, not a caption overlay.

## Records and identities

| Record | Meaning and proposed fields |
| --- | --- |
| Source transcript | Stable transcript ID, source content fingerprint/media identity, audio stream, schema, language/model/settings provenance, ordered words |
| Source word | Stable word ID, recognized text, Roman display text, source in/out microseconds, timing provenance; confidence only when the backend actually supplies it |
| Correction | Text override anchored to stable word IDs; retains original recognition and timing |
| Transcript occurrence | A source word/span as used by a particular placed clip instance; occurrence identity includes the clip instance |
| Cut record | Original source interval, affected linked clip identities, cut boundary anchors and operation/history identity needed to adjust or restore |
| Sequence transcript | Derived view of surviving occurrences in current composition order; timeline times are projections, not source truth |

A source word can appear twice if a recording is reused. Cutting its first occurrence must not delete the second. Splitting a clip must preserve source mapping. Ripple cuts move timeline positions but do not alter original word timestamps. Source identity survives a project-folder move and is revalidated when media is relinked; a changed source is not silently treated as the same recording.

Source time is stored once in integer microseconds. Engine window-relative times must be shifted to the original source, not permanently saved as already-trimmed timeline coordinates. Apply the existing rate/time-phase mapping when projecting. The first new cut operation accepts normal-speed linked main-recording footage. Nested/retimed or ambiguous overlap arrangements return an explicit unsupported/conflict result until their mapping is implemented and tested.

## Proposed storage and migration

Store source recognition as immutable, versioned artifacts under `Transcripts/` inside the project. Keep project references, correction overlays and cut records in actor-owned project state so undo can recover them together. Do not keep authoritative corrections only in a browser cache or a mutable sidecar outside history.

The inspected project schema is version 3. Adding durable fields requires an explicit next-version migration and matching TypeScript serialization/Rust mirrors, preserving old fixtures. Write transcript artifacts atomically before committing their reference; abandoned artifacts can be collected later. The actor commits the reference and all edits as one state/history change. Recovery must never point to half-written recognition data. Save/checkpoint completion flushes the project references and necessary artifacts.

Opening an existing project creates a recoverable backup before migration. Older official WeftCut may reject a newer schema; it must not reopen/write the same migrated project. Use Stich's independent project copy for acceptance. Never edit project JSON behind an open actor.

## Recognition, display and correction

English words retain their text. Hindi recognition in Devanagari is displayed in Roman Hindi, with local transliteration. Preserve recognized text for comparison and future correction. Roman output can have a different visual word count; represent that as a display span mapped to stable source words rather than inventing new acoustic times.

**Correct text** is a spelling/display edit. It does not delete footage, change source timing, translate speech or synthesize replacement audio. If a correction spans multiple tokens, it remains anchored to the original selected source span. Export is unchanged by spelling-only corrections because the editing transcript is not burned into the video.

Recognition errors and estimated times remain visible and adjustable. Do not label an engine's word timestamps as frame-accurate acoustic truth. Replacing recognition must be an explicit action with anchor/reconciliation behavior; it cannot silently invalidate previous cuts or corrections.

## Cut, adjust and restore

1. Resolve selected occurrence IDs against the active workspace and expected revision.
2. Compute the selected source interval and its composition mapping. Explicit padding/boundary parameters can extend it; no fixed editorial pause-removal recipe is implied. A pause with no words can be cut through range/timeline controls.
3. Preview/dry-run the linked split/delete/ripple plan, including affected tracks and duration. Normalize adjacent selections and use existing frame/sample rules for synchronized A/V.
4. Validate locked layers, linked relationships, neighboring bounds and overlapping tracks before any write. First-scope commands reject ambiguous unsupported arrangements rather than perform partial edits or silently drop an overlap.
5. Commit the validated linked edit, cut record and transcript projection changes as one history operation. Return actual IDs, new revision and duration delta.

Ripple behavior follows the existing composition rules for all affected tracks. It must be identical whether requested by a person, WebMCP or server MCP. Test supported overlays; do not infer that closing a main-track gap permits overwriting unrelated locked content.

**Adjust cut** changes a boundary using original source handles and listening context. It can shorten the retained clip or recover more speech. Clamp/refuse out-of-source requests and collisions explicitly. **Restore cut** reinserts a removed interval when the arrangement permits it and restores its words. If later edits conflict, explain the conflict and offer a valid operation; do not claim unconditional restore. Undo remains available for coherent recent edits.

Manual UI supplies selection-to-preview highlighting, separate Cut/Correct text actions, before/after audition, waveform and boundary handles, restore and undo. Tools expose the same primitives. Editorial decisions belong to the user/agent conversation.

## Essential scenarios

- A misspelled name is corrected: rendered duration and footage do not change.
- A Hindi display span maps to two recognized tokens: deletion selects the actual source interval.
- Two copies of a spoken sentence exist: cutting one leaves the other.
- A clip is split, cut three times and rippled: remaining words still map to original speech.
- A cut lands inside a breath or consonant: the user auditions and restores a small amount of source.
- A pause has no words: range trim remains available without deleting invented words.
- A human adjusts an AI cut and then undoes: picture, sound and transcript agree.
- A stale agent submits a cut after the human edits: conflict response, no partial mutation.
- A locked overlapping track or unsupported retime is present: predictable refusal before mutation.
- Save/reopen/crash recovery reproduces correction, cut history/checkpoints and references.
