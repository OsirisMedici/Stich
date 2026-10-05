# Stich continuation handoff

Updated 2026-10-05. Public home: https://github.com/OsirisMedici/Stich.

## Start here

Read README.md, STICH.md and plans/stich-in-codex/MVP.md before changing the app. Check the actual running build, git status and current project. The public main branch contains the complete MVP source and accepted plan. Local machine-specific paths, app hashes and demo state belong to the private continuation note.

## Product decisions

Build for humans and expose the same operations to agents. The first complete job is transcript-driven rough trimming of a recorded video, followed by raw MP4 handoff. Keep the full timeline beside Codex chat. Codex may manage project/file import, preview, editing, saving and export. Editorial choices remain with the user and their agent; do not hard-code a cut recipe.

Compute and media stay on the Mac. Use free local recognition with Whisper Base/whisper.cpp. Mostly English footage can contain Hindi/Hinglish; display spoken Hindi in editable Roman letters. Spelling correction must not change timing. Word deletion removes linked A/V with ripple. Include nearby playback and small edge adjustments. Team/VPS support comes later.

Keep the official WeftCut application, profile and active projects separate. Do not open one project in both editors simultaneously.

## Architecture and entry points

- `apps/desktop/src/main/stich/service.ts`: speech artifacts, jobs, transcript mutations, guarded retries and export coordination.
- `apps/desktop/src/main/stich/browserHost.ts`: authenticated localhost browser hosting, scoped file streaming and page tool dispatch.
- `apps/desktop/src/renderer/stich/`: browser bridge, transcript panel and MP4 controls.
- `apps/desktop/src/main/state/`: shared TypeScript project actor, timeline mutations and persistence.
- `apps/desktop/native/src/jobs/`: independent audio worker and orientation-preserving preview recipes.
- `skills/stich/SKILL.md`: operator instructions. Update tool descriptions and this skill when contracts change.

The native addon must be built from this MVP source. Reusing the upstream primary addon loses the media scheduling fixes. Keep packaging/license checks enabled.

## Verified and still open

MVP.md records local recognition timings, cut/undo/save/export checks, browser authentication checks and regressions. The final source passed production build and typecheck before publication. Publication changes documentation, repository metadata and manual workflow triggers; it does not replace the installed application.

The next acceptance work should measure smooth playback and CPU/memory under representative load, validate Hindi/code-switching and word timings by listening, test malformed transcripts and interrupted cross-volume moves, and decide durable job recovery. Current actor undo/checkpoints reset when a project reopens. Jobs do not resume after app quit. Do not label these broader acceptance gates complete.

## Public maintenance

Push source and reviewed documentation. Keep footage, generated transcripts, model weights, packaged apps, localhost launch grants and profile authentication files out of Git. Upstream history and MIT attribution are retained. The initial Stich public commit collects the reviewed source without publishing the earlier machine-specific operational history. The inherited cross-platform CI and mutation workflows are available for manual runs; no installer release is promised.
