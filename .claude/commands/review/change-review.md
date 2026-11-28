---
description: Establish the scope of recent codebase changes via Git and write a structured report of changed file paths to docs/reviews/ for downstream commands to consume.
argument-hint: '[additional context] (optional - e.g., "review git commit abc123", "review git commit abc123 def456", "review git range abc123..def456", "focus on backend/")'
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(mkdir:*), Bash(date:*), Write, AskUserQuestion
---

# /change-review: Scope Codebase Changes

## Philosophy (Why this exists)

Before auditing dependencies, lockfiles, ignore lists, or documentation, the scope of what changed must be established. This command owns that responsibility. It examines Git state, collects changed file paths, and writes a structured report that downstream commands consume as their input. This avoids duplicating scope logic across commands and ensures a single source of truth for what changed.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/change-review`
- `/change-review review git commit abc123`
- `/change-review review git commit abc123 def456`
- `/change-review review git range abc123..def456`
- `/change-review focus on changes in backend/ and infra/`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Optional**: `$ARGUMENTS` may be omitted. If omitted, scope is derived entirely from Git state.

**Argument contract**

- Required args: None
- Optional args: `$ARGUMENTS` = additional context to identify review scope, such as one or more commit hashes, one commit range, directories, or focus areas
- Defaults: When omitted, use current staged, unstaged, and untracked changes to determine scope
- Validation rules:
  - Free-form text is allowed.
  - Any referenced commit or range must resolve in Git.
  - Do not combine commit-list mode and range mode in one invocation unless the user explicitly clarifies the intended scope.

**If arguments are missing/invalid**

- If omitted, proceed using current Git state.
- If a referenced commit or range cannot be resolved, stop and ask for a valid commit, range, or scope.
- If the requested scope is ambiguous, stop and ask a targeted question before writing the report.

## Context to Load (INPUT)

**Capture live state**

- !`git status`

## Process (PROCESS)

Follow these steps in order:

1. **Gather Git state.**
   - Run `git status`, `git diff --name-only`, and `git diff --staged --name-only` to identify uncommitted changes, staged changes, and untracked files.
   - If `$ARGUMENTS` references one or more commit hashes, run `git show --name-only <commit...>` to identify only files changed by those commits.
   - If `$ARGUMENTS` references a range, run `git diff <range> --name-only` to identify only files changed by that range.
   - If no commit or range is referenced, run `git ls-files --others --exclude-standard` and include current staged, unstaged, and untracked changes.
   - If `$ARGUMENTS` references a directory or area, use it to narrow whichever scope mode applies.
   - Do not include unrelated staged, unstaged, or untracked changes when one or more commits or a range is provided unless the user explicitly asks for them.
   - If `$ARGUMENTS` is empty and Git shows no current changes, run `git log --oneline -10` and ask the user which recent commit(s) to review. Do not assume the codebase is clean.
   - If the repo is not a Git repo or Git data is unavailable, state the limitation and ask the user which files to review.

2. **Collect changed file paths.**
   - Compile a deduplicated list of all changed file paths identified by the selected scope mode in Step 1.
   - Sort changed file paths alphabetically.

3. **Write the report file as the Saved File section describes.**

4. **Return the final response as the Output section describes.**

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.

**Quality/Safety constraints**

- Do not modify any files other than the report file.
- Do not include unrelated staged, unstaged, or untracked changes when commit or range scope is provided unless explicitly requested.
- Stage nothing and commit nothing.

## Saved File (OUTPUT)

- **Path**: `docs/reviews/change-review-<YYYY-MM-DD-HHMMSS>.yaml`
- **Naming rule**: `<YYYY-MM-DD-HHMMSS>` is the date and time of the run. Create `docs/reviews/` if it does not exist.
- **Written for**: a later command.
- **If the file already exists**: Replace it.

**Layout**

Include only non-empty fields. Omit empty lists/objects entirely.

```yaml
status: # success | partial | blocked
summary: # one sentence describing the scope of changes reviewed
timestamp: # ISO 8601 timestamp of when this report was generated
scope_source: # how scope was determined (e.g., "current Git state", "git show abc123 def456", "git diff abc123..def456", "$ARGUMENTS: focus on backend/")

changed_files:
  -  # relative path to changed file
  -  # one entry per changed file (deduplicated, sorted alphabetically)


# Optional (include only when relevant)

# assumptions:
#   - # assumption made during scoping

# blockers:
#   - # what is blocking and what input is needed
```

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return the following, and repeat nothing that is in the file:

- **Status**: `Success`, `Partial` or `Blocked`, matching the `status` written to the file. If the file could not be written, `Blocked` with the reason.
- **File**: the absolute path of the saved file, on its own line
- **Questions (only if blocked)**: numbered list
