---
description: Create a single git worktree branched off the local `main` branch on a branch named `<type>/<name>` (type is `feature`, `fix`, `chore` or `docs`, default `feature`) and install Python/uv dependencies.
argument-hint: [type] <name> (name required - short kebab-case work name; type optional - `feature`, `fix`, `chore` or `docs`, default `feature`)
allowed-tools: Bash(git check-ref-format:*), Bash(git check-ignore:*), Bash(git rev-parse:*), Bash(git show-ref:*), Bash(git for-each-ref:*), Bash(git worktree:*), Bash(git fetch:*), Bash(git rev-list:*), Bash(git -C:*), Bash(test:*), Bash(mkdir:*), Bash(grep:*), Bash(pwd:*), Bash(dirname:*), Bash(uv --version:*), Bash(uv sync:*)
---

# /new-worktree: Create Worktree Off Main

## Philosophy (Why this exists)

This command keeps work in progress in its own worktree and centralises the setup in one command. It ensures every piece of work must branch off the same base (`main`), follow the same name pattern (`<type>/<name>`), and live in the same ready-to-use Python/uv worktree (`worktrees/<folder>`).

## Invocation & Arguments (INPUT)

**Usage examples**

- `/new-worktree login-page`
- `/new-worktree pdf-table-detection`
- `/new-worktree fix login-timeout`
- `/new-worktree chore bump-deps`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Mandatory**: `$ARGUMENTS` is required and must hold a name, optionally preceded by a type. If missing or invalid, stop and ask.

**Argument contract**

- Required args: `$ARGUMENTS` = one word (the work name) or two words (the type, then the work name), separated by a space. The work name is in kebab-case (e.g. `login-page`).
- Optional args: a type before the name. It is one of `feature`, `fix`, `chore` or `docs`.
- Defaults: the type is `feature` when omitted.
  - Fixed conventions (not user-configurable): the base branch is always `main`. Every type branches from it.
- Derived values, computed in Step 1 and used by every later step:
  - `TYPE`: the type given, or `feature` when none was given.
  - `NAME`: the name.
  - `BRANCH`: `TYPE/NAME`.
  - `FOLDER`: `TYPE-NAME`. The worktree path is `worktrees/FOLDER`.
- Validation rules:
  - Must be non-empty after trimming whitespace.
  - Must be either one word (the name) or two words (a type, then the name).
  - When two words are given, the first must be exactly `feature`, `fix`, `chore` or `docs`.
  - `NAME` must satisfy every rule below:
    - Must not contain shell metacharacters: `;`, `&`, `|`, `` ` ``, `$`, `(`, `)`, `<`, `>`, `*`, `?`, `[`, `]`, `{`, `}`, `\`, `'`, `"`, `!`.
    - Must not start with `/` or `-`.
    - Must not contain `..`, `@{`, or `/` (single segment only).
    - Must not equal (case-insensitively) any git pseudo-ref: `HEAD`, `FETCH_HEAD`, `ORIG_HEAD`, `MERGE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, `BISECT_HEAD`.
    - Must not equal (case-insensitively) any workflow-reserved name: `main`, `master`, `feature`, `fix`, `chore`, `docs`.
    - Must match strict kebab-case: regex `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` (lowercase letter start, then dash-separated lowercase-alphanumeric segments; no underscores, no uppercase, no leading digit or hyphen, no trailing hyphen, no consecutive hyphens).
  - `refs/heads/$BRANCH` must pass `git check-ref-format`.

**If arguments are missing/invalid**

- Stop before running any git mutations. Explain the problem, ask for a valid name and show a valid example. If the type is not allowed, list the allowed types.

## Process (PROCESS)

Follow these steps in order:

1. **Parse and validate `$ARGUMENTS`.**
   - Trim surrounding whitespace.
   - Split on whitespace. Set `TYPE` and `NAME` from the words, then compute `BRANCH` and `FOLDER` as defined in _Argument contract_.
   - Reject the value if any rule in _Validation rules_ is violated. On reject, stop and tell the user which validation rule was violated.
   - Run `git check-ref-format "refs/heads/$BRANCH"` (no `--branch` — running with `--branch` would first expand `@{-N}` "previous checkout" shortcuts against your current state, which is not what we want for literal-string validation). If exit code is non-zero, stop and tell the user the branch name fails git's ref-format check.
2. **Confirm cwd is the main repo root.** Run each check in order; on the first that fails, stop and tell the user the matching message.
   - **Not in a git repo**: run `git rev-parse --is-inside-work-tree`. If exit code is non-zero, stop with "cwd is not inside a git repository; cd into the repo and re-run."
   - **Bare repo**: run `git rev-parse --is-bare-repository`. If output is `true`, stop with "bare repos are not supported by this command."
   - **Linked worktree (covers both the worktree root and any subdirectory of one)**: run `git rev-parse --path-format=absolute --git-dir` and capture as `GD`; run `git rev-parse --path-format=absolute --git-common-dir` and capture as `GCD`. If `GD` != `GCD`, compute `MAIN_ROOT` as `dirname "$GCD"`, then stop with "you are in a linked worktree; cd $MAIN_ROOT and re-run."
   - **Subdirectory of main repo**: run `pwd -P` and capture as `CWD`; run `git rev-parse --show-toplevel` and capture as `TOPLEVEL`. If `CWD` != `TOPLEVEL`, stop with "you are in a subdirectory of the main repo; cd $TOPLEVEL and re-run."
3. **Confirm this is a uv-managed project and `uv` is installed.**
   - Run: `test -f pyproject.toml`. If it does not exist, stop and tell the user that this is not a uv-managed project.
   - Run: `uv --version`. If it fails, stop and tell the user to install `uv`. Do not attempt a fallback installer.
4. **Confirm the `app/` directory exists at the repo root.**
   - Run: `test -d app`.
   - If it does not exist, stop and tell the user that an `app/` directory is required at the repo root.
5. **Confirm `pytest`, `mypy`, and `pyright` are declared in `pyproject.toml`.**
   - Run: `grep -qE '"pytest[^A-Za-z0-9_.-]' pyproject.toml && grep -qE '"mypy[^A-Za-z0-9_.-]' pyproject.toml && grep -qE '"pyright[^A-Za-z0-9_.-]' pyproject.toml`.
   - Each pattern matches the quoted package name with or without a version constraint, such as `"pytest"` or `"pytest>=8.3"`. It does not match a different package whose name only starts the same way, such as `"pytest-cov"`.
   - If any of the three is missing, stop and tell the user which tool(s) are missing and to add them with `uv add --dev pytest mypy pyright`.
6. **Confirm `worktrees/` is ignored by git.**
   - Run: `git check-ignore -q worktrees/.probe`.
   - If exit code is non-zero (the path is NOT ignored), stop and tell the user to add `worktrees/` to `.gitignore` (committed) or to `.git/info/exclude` (personal-only).
7. **Confirm the local `main` branch exists.**
   - Run: `git show-ref --verify --quiet refs/heads/main`.
   - If it does not exist, stop and tell the user that a local `main` branch is required.
8. **Refuse on any pre-existing target artifact.** Run each check in order; on the first that matches, stop and tell the user what to clean up.
   - **Registered worktree**: run `grep -qE "^worktree .*/worktrees/${FOLDER}$" <<< "$(git worktree list --porcelain)"`. If exit code is 0, git already records a worktree at this path. Then run `test -e "worktrees/$FOLDER" || test -L "worktrees/$FOLDER"` to see whether it is still on disk.
     - **Live worktree** (still on disk): stop and tell the user that `$BRANCH` already has a worktree at `worktrees/$FOLDER`. Tell them to finish it with `/merge-worktrees` or choose a different name. Never tell the user to delete the folder, because it may hold uncommitted work.
     - **Orphan admin entry** (gone from disk): stop and instruct the user to run `git worktree prune`, then retry.
   - **Existing folder or symlink**: run `test ! -e "worktrees/$FOLDER" && test ! -L "worktrees/$FOLDER"`. If either test fails, stop and instruct the user to remove `worktrees/$FOLDER` (or whatever it points to, if it's a symlink) or choose a different name.
   - **Existing branch (case-insensitive)**: run `grep -ix "refs/heads/$BRANCH" <<< "$(git for-each-ref --format='%(refname)' refs/heads/)"`. If any match, stop and instruct the user to delete the matching branch or choose a different name.
9. **Check whether local `main` is behind its remote (warn-only).**
   - Always include the outcome under "What you did" in the final report; never silently skip, never stop the process.
   - Run: `git fetch origin main`. If it exits non-zero (no network, no `origin` remote, or no remote branch), substitute the git error as the outcome and proceed to Step 10.
   - Otherwise run: `git show-ref --verify --quiet refs/remotes/origin/main`. If the ref does not exist (e.g. custom `remote.origin.fetch` refspec), substitute "refs/remotes/origin/main is not present locally" as the outcome and proceed to Step 10.
   - Otherwise run: `git rev-list --left-right --count main...origin/main`. It prints two counts. The first is the number of commits on `main` that `origin/main` lacks (ahead). The second is the number of commits on `origin/main` that `main` lacks (behind). Substitute the matching outcome:
     - Both 0: "main is up to date with origin/main".
     - Ahead only: "main is N commit(s) ahead of origin/main".
     - Behind only: "main is N commit(s) behind origin/main". Also add that line under **Risks / gotchas**.
     - Both above 0: "main has diverged from origin/main: N commit(s) ahead and M commit(s) behind". Also add that line under **Risks / gotchas**.
10. **Create the worktree branched off `main`.**
    - Run: `mkdir -p worktrees`.
    - Run: `git worktree add -b "$BRANCH" "worktrees/$FOLDER" main`.
    - If this fails, capture the exact git error, run `git worktree prune` to clear any admin debris, and stop and tell the user the captured git error.
11. **Install Python/uv dependencies inside the new worktree.**
    - Run: `uv sync --locked --directory "worktrees/$FOLDER"`. The `--locked` flag stops with an error instead of rewriting `uv.lock` when it is missing or out of date.
    - If `uv sync` fails, capture the error and add it under **Risks / gotchas** in the final report, mark the run as `Status: Partial`, and continue to Step 12.
12. **Confirm the new worktree is on the correct branch.**
    - Run: `git -C "worktrees/$FOLDER" branch --show-current`.
    - If the output differs from `$BRANCH`, add the mismatch under **Risks / gotchas** in the final report and mark the run as `Status: Partial`.
13. **Produce the final response using the OUTPUT section.** Include the Step 9 outcome under "What you did" verbatim.

**Decision discipline**

- Never invent or auto-derive a name; always require it in `$ARGUMENTS` from the user. Never guess the type from the name: it is `feature` unless the user states another.
- Never silently overwrite an existing worktree folder, branch, or `.venv`.
- If a non-fatal step fails after the worktree exists, report Partial and never auto-clean — the user inspects the partial artifact.
- Refuse-and-report is the default disposition; do not attempt to repair or resume previous partial states.

**Quality/Safety constraints**

- Always branch from the local `main` branch; never fall back to `master`, the current branch, or a remote-tracking branch.
- Do not run `git add`, `git commit`, or `git push` in this command — setup only.
- Do not modify files outside `worktrees/$FOLDER` and git's own worktree metadata.
- Do not start any server, run any health check, reserve ports, or kill server processes; this project has no web server.
- Do not create a second worktree in the same invocation; this command is single-worktree only.

## Output (OUTPUT)

### Human-Readable Report

Return a concise, easy-to-scan summary in plain language at a 16-year-old reading level:

- **Status**: Success | Partial | Blocked
- **What you understood**: 1–3 bullets restating the type, name, branch name, and worktree path.
- **What you did**: bullets, in execution order (e.g. created worktree, created branch, ran `uv sync`, plus the Step 9 freshness outcome verbatim).
- **Key results**:
  - Worktree path: `worktrees/<folder>`
  - Branch: `<type>/<name>`
  - Base branch: `main`
  - uv sync: result
- **Risks / gotchas**: bullets, only when real (e.g. freshness behind or diverged, partial `.venv`, branch mismatch).
- **Next steps**: exact command `cd worktrees/<folder>` to enter the worktree and start development. If `Status: Partial` because of `uv sync`, also include the exact follow-up command for the user to run.
- **Questions (only if blocked)**: numbered list of what is needed to unblock.

## Notes

- Hardcoded assumptions: project uses Python + `uv` with `uv.lock` committed; project source lives under `app/`; `pytest`, `mypy`, and `pyright` are declared as dev dependencies; project has no web server; all worktrees live under `worktrees/` at the repo root.
- Known limitations: the warn-only fetch in Step 9 always emits an outcome under "What you did" (skipped / up to date / ahead / behind / diverged), but the check itself is best-effort — on network or remote failure it substitutes the git error and proceeds. `pyproject.toml` presence and dev-dependency declarations are checked but the file's contents are not otherwise validated.
