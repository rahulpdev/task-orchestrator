---
name: new-worktree
description: Create a single git worktree branched off the local `main` or `integration` branch on a branch named `<type>/<name>` (type is `feature`, `fix`, `chore` or `docs`, default `feature`) and install the project's Python/uv or pnpm dependencies.
argument-hint: [base] [type] <name> (name required - short kebab-case work name; base optional - `main` or `integration`, default `main`; type optional - `feature`, `fix`, `chore` or `docs`, default `feature`)
allowed-tools: Read, Bash(git check-ref-format:*), Bash(git check-ignore:*), Bash(git rev-parse:*), Bash(git show-ref:*), Bash(git for-each-ref:*), Bash(git worktree:*), Bash(git fetch:*), Bash(git rev-list:*), Bash(git -C:*), Bash(test:*), Bash(mkdir:*), Bash(grep:*), Bash(pwd:*), Bash(dirname:*), Bash(uv --version:*), Bash(uv sync:*), Bash(pnpm --version:*), Bash(node --version:*), Bash(pnpm install:*)
---

# /new-worktree: Create Worktree

## Philosophy (Why this exists)

This command keeps work in progress in its own worktree and centralises the setup in one command. It ensures every piece of work must branch off a stated base (`main` or `integration`), follow the same name pattern (`<type>/<name>`), and live in the same ready-to-use worktree (`worktrees/<folder>`), whether the project uses Python/uv or pnpm.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/new-worktree login-page`
- `/new-worktree pdf-table-detection`
- `/new-worktree fix login-timeout`
- `/new-worktree chore bump-deps`
- `/new-worktree integration login-page`
- `/new-worktree integration fix login-timeout`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Mandatory**: `$ARGUMENTS` is required and must hold a name, optionally preceded by a base branch, a type, or both. If missing or invalid, stop and ask.

**Argument contract**

- Required args: `$ARGUMENTS` = the work name, optionally preceded by a base branch, a type, or both, in that order, separated by spaces. The work name is in kebab-case (e.g. `login-page`).
- Optional args: a base branch, first. It is `main` or `integration`. Then a type, directly before the name. It is one of `feature`, `fix`, `chore` or `docs`.
- Defaults: the base branch is `main` and the type is `feature` when omitted.
  - Fixed conventions (not user-configurable): every type branches from the base branch.
- Derived values, computed in Step 1 and used by every later step:
  - `BASE`: the base branch given, or `main` when none was given.
  - `TYPE`: the type given, or `feature` when none was given.
  - `NAME`: the name.
  - `BRANCH`: `TYPE/NAME`.
  - `FOLDER`: `TYPE-NAME`. The worktree path is `worktrees/FOLDER`.
- Validation rules:
  - Must be non-empty after trimming whitespace.
  - Must be one, two or three words: an optional base branch, an optional type, then the name.
  - A base branch, when given, must come first and be exactly `main` or `integration`.
  - A type, when given, must come directly before the name and be exactly `feature`, `fix`, `chore` or `docs`.
  - `NAME` must satisfy every rule below:
    - Must not contain shell metacharacters: `;`, `&`, `|`, `` ` ``, `$`, `(`, `)`, `<`, `>`, `*`, `?`, `[`, `]`, `{`, `}`, `\`, `'`, `"`, `!`.
    - Must not start with `/` or `-`.
    - Must not contain `..`, `@{`, or `/` (single segment only).
    - Must not equal (case-insensitively) any git pseudo-ref: `HEAD`, `FETCH_HEAD`, `ORIG_HEAD`, `MERGE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, `BISECT_HEAD`.
    - Must not equal (case-insensitively) any workflow-reserved name: `main`, `master`, `integration`, `feature`, `fix`, `chore`, `docs`.
    - Must match strict kebab-case: regex `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` (lowercase letter start, then dash-separated lowercase-alphanumeric segments; no underscores, no uppercase, no leading digit or hyphen, no trailing hyphen, no consecutive hyphens).
  - `refs/heads/$BRANCH` must pass `git check-ref-format`.

**If arguments are missing/invalid**

- Stop before running any git mutations. Explain the problem, ask for a valid name and show a valid example. If the base branch or the type is not allowed, list the allowed values.

## Process (PROCESS)

Follow these steps in order:

1. **Parse and validate `$ARGUMENTS`.**
   - Trim surrounding whitespace.
   - Split on whitespace. Set `BASE`, `TYPE` and `NAME` from the words, then compute `BRANCH` and `FOLDER` as defined in _Argument contract_.
   - Reject the value if any rule in _Validation rules_ is violated. On reject, stop and tell the user which validation rule was violated.
   - Run `git check-ref-format "refs/heads/$BRANCH"` (no `--branch` — running with `--branch` would first expand `@{-N}` "previous checkout" shortcuts against your current state, which is not what we want for literal-string validation). If exit code is non-zero, stop and tell the user the branch name fails git's ref-format check.
2. **Confirm cwd is the main repo root.** Run each check in order; on the first that fails, stop and tell the user the matching message.
   - **Not in a git repo**: run `git rev-parse --is-inside-work-tree`. If exit code is non-zero, stop with "cwd is not inside a git repository; cd into the repo and re-run."
   - **Bare repo**: run `git rev-parse --is-bare-repository`. If output is `true`, stop with "bare repos are not supported by this command."
   - **Linked worktree (covers both the worktree root and any subdirectory of one)**: run `git rev-parse --path-format=absolute --git-dir` and capture as `GD`; run `git rev-parse --path-format=absolute --git-common-dir` and capture as `GCD`. If `GD` != `GCD`, compute `MAIN_ROOT` as `dirname "$GCD"`, then stop with "you are in a linked worktree; cd $MAIN_ROOT and re-run."
   - **Subdirectory of main repo**: run `pwd -P` and capture as `CWD`; run `git rev-parse --show-toplevel` and capture as `TOPLEVEL`. If `CWD` != `TOPLEVEL`, stop with "you are in a subdirectory of the main repo; cd $TOPLEVEL and re-run."
3. **Decide the tool set.**
   - Run: `test -f pnpm-workspace.yaml` and `test -f pyproject.toml`.
   - If only `pnpm-workspace.yaml` exists, the tool set is pnpm and the tool-set file is `pnpm.md`. If only `pyproject.toml` exists, the tool set is Python/uv and the tool-set file is `python.md`.
   - If both exist or neither exists, stop and ask the user which tool set this project uses.
4. **Read the tool-set file.** Read it in full from this skill's folder. Its sections are referred to by name in the steps below.
5. **Run the checks under _Checks_ in the tool-set file.** Run each in order; on the first that fails, stop and tell the user the matching message.
6. **Confirm `worktrees/` is ignored by git.**
   - Run: `git check-ignore -q worktrees/.probe`.
   - If exit code is non-zero (the path is NOT ignored), stop and tell the user to add `worktrees/` to `.gitignore` (committed) or to `.git/info/exclude` (personal-only).
7. **Confirm the local `$BASE` branch exists.**
   - Run: `git show-ref --verify --quiet refs/heads/$BASE`.
   - If it does not exist, stop and tell the user that a local `$BASE` branch is required.
8. **Refuse on any pre-existing target artifact.** Run each check in order; on the first that matches, stop and tell the user what to clean up.
   - **Registered worktree**: run `grep -qE "^worktree .*/worktrees/${FOLDER}$" <<< "$(git worktree list --porcelain)"`. If exit code is 0, git already records a worktree at this path. Then run `test -e "worktrees/$FOLDER" || test -L "worktrees/$FOLDER"` to see whether it is still on disk.
     - **Live worktree** (still on disk): stop and tell the user that `$BRANCH` already has a worktree at `worktrees/$FOLDER`. Tell them to finish it with `/merge-worktrees` or choose a different name. Never tell the user to delete the folder, because it may hold uncommitted work.
     - **Orphan admin entry** (gone from disk): stop and instruct the user to run `git worktree prune`, then retry.
   - **Existing folder or symlink**: run `test ! -e "worktrees/$FOLDER" && test ! -L "worktrees/$FOLDER"`. If either test fails, stop and instruct the user to remove `worktrees/$FOLDER` (or whatever it points to, if it's a symlink) or choose a different name.
   - **Existing branch (case-insensitive)**: run `grep -ix "refs/heads/$BRANCH" <<< "$(git for-each-ref --format='%(refname)' refs/heads/)"`. If any match, stop and instruct the user to delete the matching branch or choose a different name.
9. **Check whether local `$BASE` is behind its remote (warn-only).**
   - Always include the outcome under "What you did" in the final report; never silently skip, never stop the process.
   - Run: `git fetch origin "$BASE"`. If it exits non-zero (no network, no `origin` remote, or no remote branch), substitute the git error as the outcome and proceed to Step 10.
   - Otherwise run: `git show-ref --verify --quiet refs/remotes/origin/$BASE`. If the ref does not exist (e.g. custom `remote.origin.fetch` refspec), substitute "refs/remotes/origin/$BASE is not present locally" as the outcome and proceed to Step 10.
   - Otherwise run: `git rev-list --left-right --count "$BASE...origin/$BASE"`. It prints two counts. The first is the number of commits on `$BASE` that `origin/$BASE` lacks (ahead). The second is the number of commits on `origin/$BASE` that `$BASE` lacks (behind). Substitute the matching outcome:
     - Both 0: "$BASE is up to date with origin/$BASE".
     - Ahead only: "$BASE is N commit(s) ahead of origin/$BASE".
     - Behind only: "$BASE is N commit(s) behind origin/$BASE". Also add that line under **Risks / gotchas**.
     - Both above 0: "$BASE has diverged from origin/$BASE: N commit(s) ahead and M commit(s) behind". Also add that line under **Risks / gotchas**.
10. **Create the worktree branched off `$BASE`.**
    - Run: `mkdir -p worktrees`.
    - Run: `git worktree add -b "$BRANCH" "worktrees/$FOLDER" "$BASE"`.
    - If this fails, capture the exact git error, run `git worktree prune` to clear any admin debris, and stop and tell the user the captured git error.
11. **Install dependencies inside the new worktree.** Follow _Install_ in the tool-set file.
12. **Confirm the new worktree is on the correct branch.**
    - Run: `git -C "worktrees/$FOLDER" branch --show-current`.
    - If the output differs from `$BRANCH`, add the mismatch under **Risks / gotchas** in the final report and mark the run as `Status: Partial`.
13. **Produce the final response using the OUTPUT section.** Include the Step 9 outcome under "What you did" verbatim.

**Decision discipline**

- Never invent or auto-derive a name; always require it in `$ARGUMENTS` from the user. Never guess the type from the name: it is `feature` unless the user states another. Never guess the base branch: it is `main` unless the user states `integration`.
- Never silently overwrite an existing worktree folder, branch, or installed dependencies (`.venv` or `node_modules`).
- If a non-fatal step fails after the worktree exists, report Partial and never auto-clean — the user inspects the partial artifact.
- Refuse-and-report is the default disposition; do not attempt to repair or resume previous partial states.

**Quality/Safety constraints**

- Always branch from the local `$BASE` branch; never fall back to another branch, the current branch, or a remote-tracking branch.
- Do not run `git add`, `git commit`, or `git push` in this command — setup only.
- Do not modify files outside `worktrees/$FOLDER` and git's own worktree metadata.
- Do not start any server, run any health check, reserve ports, or kill server processes; this project has no web server.
- Do not create a second worktree in the same invocation; this command is single-worktree only.

## Output (OUTPUT)

### Human-Readable Report

Return a concise, easy-to-scan summary:

- **Status**: Success | Partial | Blocked
- **What you understood**: 1–3 bullets restating the base branch, type, name, branch name, and worktree path.
- **What you did**: bullets, in execution order (e.g. created worktree, created branch, installed dependencies, plus the Step 9 freshness outcome verbatim).
- **Key results**:
  - Worktree path: `worktrees/<folder>`
  - Branch: `<type>/<name>`
  - Base branch: `main` or `integration`
  - Dependency install: result
- **Risks / gotchas**: bullets, only when real (e.g. freshness behind or diverged, partial install, branch mismatch).
- **Next steps**: exact command `cd worktrees/<folder>` to enter the worktree and start development. If `Status: Partial` because the install failed, also include the exact follow-up command for the user to run.
- **Questions (only if blocked)**: numbered list of what is needed to unblock.

## Notes

- Hardcoded assumptions: project has no web server; all worktrees live under `worktrees/` at the repo root. The tool-set file lists the assumptions for its tool set.
- Known limitations: the warn-only fetch in Step 9 always emits an outcome under "What you did" (skipped / up to date / ahead / behind / diverged), but the check itself is best-effort — on network or remote failure it substitutes the git error and proceeds.
