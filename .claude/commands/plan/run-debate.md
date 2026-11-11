---
description: Set up a dialectic-agentic debate workspace from two source files (and an optional config) by symlinking them into a sibling /debate workspace, then launch the debate by following the orchestrate skill.
argument-hint: <problem-file.md> <context-file.md> [debate-config.json] (required - two absolute .md paths in the same folder; optional - absolute debate-config.json config path in that same folder)
allowed-tools: Bash, Read, Write, Edit, Task, WebSearch
---

# /run-debate: Launch a Dialectic Debate

## Philosophy (Why this exists)

A debate workspace must hold a `problem.md` and optional `context/` files in one folder, but the source material usually lives elsewhere and shouldn't be duplicated. This wrapper assembles a throwaway `/debate` workspace via symlinks (so edits to the originals stay live) and invokes the debate with explicit `PROJECT`/`WORKSPACE` paths, because a bare `skills/` clone is not auto-discoverable.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/run-debate /Users/rahulmac/work/auth/problem-definition.md /Users/rahulmac/work/auth/solution.md`
- `/run-debate /Users/rahulmac/work/auth/problem-definition.md /Users/rahulmac/work/auth/solution.md /Users/rahulmac/work/auth/debate-config.json`

**Arguments received**

- Positional: `$1` (problem file), `$2` (context file), `$3` (config file, optional)

**Arguments policy**

- **Mandatory**: `$1` and `$2` are required. `$3` is optional. If a required arg is missing or invalid, stop and report — do not proceed.

**Argument contract**

- Required args:
  - `$1` — absolute path to an existing `.md` file (becomes `problem.md`)
  - `$2` — absolute path to an existing `.md` file (becomes the context file)
- Optional args:
  - `$3` — absolute path to an existing `.json` file (passed as `DEBATE_CONFIG`)
- Validation rules:
  - All supplied paths must be **absolute** (start with `/`) and point to **existing files**.
  - `$1` and `$2` must end in `.md`; `$3` (if given) must end in `.json`.
  - `$1`, `$2`, and `$3` (if given) must all reside in the **same source folder**.
  - Paths must not contain spaces.

**If arguments are missing/invalid**

- Print a one-line error stating which check failed and stop. Do not create files or launch the debate.

## Process (PROCESS)

1. **Validate the arguments.**
   - `$1` and `$2` are required. If either is missing, stop and ask the user for the two `.md` paths. `$3` is optional.
   - Each supplied path must be absolute (start with `/`). If not, stop and report which one is invalid.
   - Confirm each supplied path is an existing file: run `test -f "$1"`, `test -f "$2"`, and (only if supplied) `test -f "$3"`. If any fails, stop and report.
   - `$1` and `$2` must end in `.md`; `$3` (if supplied) must end in `.json`. If not, stop and report.
   - `$1`, `$2`, and `$3` (if supplied) must share one parent folder (the source folder). Compare `dirname "$1"`, `dirname "$2"`, and `dirname "$3"`. If they differ, stop and report.
2. **Build the debate workspace in the source folder** (the folder containing `$1`).
   - Run: `mkdir -p "$(dirname "$1")/debate/context"`.
   - If `$(dirname "$1")/debate/problem.md` exists and is not a symlink, stop and report; do not overwrite. Otherwise run: `ln -sf "$1" "$(dirname "$1")/debate/problem.md"`.
   - If `$(dirname "$1")/debate/context/$(basename "$2")` exists and is not a symlink, stop and report; do not overwrite. Otherwise run: `ln -sf "$2" "$(dirname "$1")/debate/context/$(basename "$2")"`.

3. **Launch the debate by following the orchestrate skill.**
   Read `/Users/rahulmac/ExternalRepos/dialectic-agentic/skills/orchestrate/SKILL.md` and follow it exactly with:
   - `WORKSPACE` = `$(dirname "$1")/debate`
   - `PROJECT` = `/Users/rahulmac/ExternalRepos/dialectic-agentic`
   - `DEBATE_CONFIG` = `$3`, only if `$3` was supplied; otherwise omit.

4. **Report the outcome** using the Output section below.

**Decision discipline**

- Do not invent a `WORKSPACE`, `PROJECT`, or `DEBATE_CONFIG` value. Derive `WORKSPACE` from `$1`'s folder, use the hardcoded `PROJECT`, and pass `DEBATE_CONFIG` only when `$3` is supplied.
- If Step 1 fails validation, stop and ask the user to fix the paths — do not build the workspace.

**Quality/Safety constraints**

- Never overwrite a real (non-symlink) `problem.md` or context file; the non-symlink guard in Step 2 handles this — respect it.
- Do not modify the source files (`$1`, `$2`, `$3`) or anything inside the `PROJECT` directory.
- Symlinks are created with absolute targets so the originals remain the single source of truth.

## Output (OUTPUT)

### Human-Readable Report (for humans)

- **Status**: Success | Blocked
- **What you understood**: the three resolved paths and the source folder
- **What you did**: workspace dir created, symlinks made (problem.md, context file)
- **Launch parameters**: `WORKSPACE`, `PROJECT`, and `DEBATE_CONFIG` (or "default config" if none)
- **Debate result**: where the outputs landed (e.g. `<WORKSPACE>/debate/synthesis.md`) once the orchestrate skill finishes
- **Risks / gotchas**: only if real (e.g. a pre-existing `debate/` folder was reused)
- **Questions (only if blocked)**: numbered list

## Notes (Optional)

- `PROJECT` is hardcoded to `/Users/rahulmac/ExternalRepos/dialectic-agentic`. If the clone moves, update the SKILL.md path and `PROJECT` value in Step 3.
- The optional `debate-config.json` is passed as `DEBATE_CONFIG=` (highest-precedence config), not copied into the workspace, so the workspace stays free of the JSON and the original file is referenced in place.
- `allowed-tools` is intentionally broad (`Task`, `Write`, `Edit`, `WebSearch`) because following the orchestrate skill runs a full multi-agent debate that dispatches subagents, writes round/synthesis files, and lets agents search the web — the wrapper's own setup only needs `Bash`.
