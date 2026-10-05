# Delivery, evidence and handoff

Status: planned; no implementation ticket is complete. Read [README.md](README.md) first. The initial product scope is settled; performance/model/transport decisions below require evidence.

## Ordered work

The canonical feature spec and individual implementation tickets are in `.scratch/stich-in-codex/`. This feature's documents are intentionally versioned for Mac/VPS handoff; the global scratch ignore rule remains unchanged. There is one file per ticket, following repository conventions.

| Ticket | Deliverable | Dependencies |
| --- | --- | --- |
| [01](../../../.scratch/stich-in-codex/issues/01-browser-preview-feasibility.md) | Installed-browser preview/audio spike on real Mac footage | None |
| [02](../../../.scratch/stich-in-codex/issues/02-local-speech-feasibility.md) | Local mixed-language recognition, Romanization and timing benchmark | None |
| [03](../../../.scratch/stich-in-codex/issues/03-shared-runtime-commands.md) | Typed renderer/runtime seam, revisions and idempotent commands | Findings from 01; may inventory beforehand |
| [04](../../../.scratch/stich-in-codex/issues/04-transcript-persistence.md) | Source transcript model, migration and recovery | 02, 03 |
| [05](../../../.scratch/stich-in-codex/issues/05-localhost-editor.md) | Full browser editor, launch/auth/media/events and WebMCP | 01, 03 |
| [06](../../../.scratch/stich-in-codex/issues/06-transcript-cut-controls.md) | Correct/cut/adjust/restore with manual controls and tools | 04, 05 |
| [07](../../../.scratch/stich-in-codex/issues/07-project-lifecycle-tools.md) | Project/file journey including safe folder moves | 03, 05 |
| [08](../../../.scratch/stich-in-codex/issues/08-runtime-export-job.md) | Browser-independent MP4 job and tools | 03, 05; validate finished cuts after 06 |
| [09](../../../.scratch/stich-in-codex/issues/09-codex-workflow-integration.md) | Host discovery, skill and human/agent workflow verification | 06, 07, 08 |
| [10](../../../.scratch/stich-in-codex/issues/10-mac-package-acceptance.md) | Matching Mac native/package build and product acceptance | 09 |

Dependencies are delivery order, not an instruction to start parallel agents. Implementation remains separate from this planning session.

## Gate A: browser media

Use an independent project copy and representative portrait HEVC/MOV recording, plus a small known A/V sync fixture. Close the competing official editor for measurement. Test decoded picture, rotation, audio startup, repeated seeks, cut-boundary playback, pause/stop and browser reload. Record frame drops/late frames, seek latency, peak memory and CPU with source details.

Pass requires an actually usable preview in the installed Codex browser, including sound and a documented initial activation behavior. Compare compatible proxy/Lite playback first. If it fails, investigate native binary transport and report the measured tradeoff; do not build the whole UI on a fake preview or silently switch to a new engine. Agree on finer resource budgets from this baseline; the Mac has 8 GB, so avoid sustained swap or rendering that makes the editor unusable.

## Gate B: usable local transcript

Use short reviewed samples of English, Roman-display Hindi, code-switching, names, repeated takes, pauses and background noise, followed by one representative 10-minute recording. Establish the sample wording and intended cut boundaries by listening. Compare existing local multilingual candidates under identical conditions; capture runtime and model versions/licenses, model size, memory, cold/warm run times and total usable-transcript time.

Measure real-time factor from accepting transcription on imported media to ready-to-edit output; target ≤1. Also record extraction, inference, Romanization and timing steps and separate import readiness. Report median and worst observed runs/sample count, not a fabricated reliable average. A model that meets speed but clips speech or mangles Hinglish fails the quality gate. If none meets both, report the local tradeoff and revise the target/model with Osiris; never switch to paid/cloud recognition.

Word timing acceptance is audible usable cuts with nearby correction controls, not just a parser marking timing as exact. Review boundary errors and false words in silence. Evaluate local alignment only if the existing timing fails representative cuts.

## Incremental acceptance

Use focused Vitest tests for command/state/serialization/race behavior, Rust tests where native contracts change, and browser/Electron integration tests for the adapter and jobs. Follow `docs/agents/testing.md`; do not run every suite after a prose-only edit. Use actual browser/native acceptance for media behavior that unit tests cannot establish.

| Area | Required evidence |
| --- | --- |
| Transcript edits | English/Hindi spans, duplicate clip use, splits/ripple, silence, correction without footage change, boundary adjustment, restore and coherent undo |
| State consistency | Stale revisions, workspace switch, retry deduplication, concurrent human edit, no duplicate WebMCP/MCP sessions |
| Persistence | Old schema fixture upgrade, save/reopen, missing/corrupt artifact, interrupted write and recoverable backups |
| Locality | Missing engine/model produces local readiness error; no audio uploads or cloud fallback from any workflow entry point |
| Browser | Full timeline, source/proxy range access, portrait orientation, audio clock, seek/stop cancellation, disconnect and actual tools discovered |
| Project management | Import known path/upload, external reference behavior, rename, same-volume move, interrupted cross-volume copy and usable recovery |
| Export | Frozen revision, cancellation, browser-close survival, runtime-interruption error, bounded memory, no original overwrite, valid final MP4 |
| Human/agent parity | Each independently completes the same agreed journey with real controls/tools and persisted readback |

For output verification, inspect actual MP4 metadata, dimensions/orientation, FPS, duration/frame count, expected audio stream and A/V drift. Play start, end and each representative cut with sound; complete a full playback for the final representative handoff. A media probe alone does not prove intelligible speech or clean joins. Record any skipped check rather than call the export verified.

## Build and release

Keep development on the private Stich branch and retain upstream notices. Review exact-version runtime and model licenses separately, FFmpeg distribution requirements and newly selected Romanization/alignment dependencies. Reuse current pinned versions where possible.

Produce matching Apple Silicon native addons and WASM from the changed native source when required. The existing helper can stage official binaries only when native sources are unchanged; a schema/native-interface change cannot ship through that shortcut. Use the isolated Node runtime documented in `STICH.md`, the pinned Rust toolchain/targets and genuine Mac FFmpeg/native build prerequisites. VPS/Linux results do not verify Mac packaging.

Test the packaged Stich app, its browser build and tools on this M2 Mac. Keep `com.osiris.stich`, profile, ports/credentials and updater separation from official WeftCut. Use disposable project copies for migration tests; do not open one folder in both apps. Preserve the original recording and existing editable cut.

Release notes identify exact commit/package, model/version, connection steps, how to perform the transcript workflow manually and through Codex, measured time/memory and known limitations. Keep the previous app package plus pre-migration project backup for rollback; rolling back the executable alone cannot downgrade a new project schema.

## Product review

Osiris should test his own 5–10 minute recording: import, transcribe, remove a section, fix a name's spelling, audition/adjust, restore/undo, save/reopen and export. Then ask Codex for the same kind of work and manually revise one AI cut. Time waiting/editing/handoff and judge speech continuity and preservation of intent against his current workflow.

No release claim is based only on compilation, number of tools or the ability to load a localhost page. Record observed behavior and remaining limitations. Public distribution, remote deployment and team support require later product work.
