---
description: Audit dependency manifests and lockfiles against the current codebase; write a structured agent handoff with all required fixes for a downstream agent to execute.
argument-hint: "<report-path> (required - path to change-review report YAML file)"
allowed-tools: Read, Glob, Grep, Bash(mkdir:*), Write, AskUserQuestion
---

# /deps-review: Pre-Merge Dependency & Lockfile Audit

## Philosophy (Why this exists)

Dependency manifests and lockfiles can drift out of alignment with the codebase over time. This command catches those gaps. It is purely diagnostic — it operates on the structured output of `/change-review`, which establishes the scope of changes in the codebase, and it produces a structured handoff for a downstream agent to execute any required fixes. This creates a clean separation of concerns: this command diagnoses, another command fixes.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/deps-review docs/reviews/change-review-2026-03-30-143022.yaml`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Mandatory**: `$ARGUMENTS` is required. If missing or invalid, stop and ask.

**Argument contract**

- Required args: `$ARGUMENTS` = path to a change-review report YAML file (produced by `/change-review`)
- Optional args: None
- Defaults: None
- Validation rules: File must exist and be a valid change-review YAML report

**If arguments are missing/invalid**

- Stop and ask the user for the report path. Suggest running `/change-review` first if no report exists.

## Context to Load (INPUT)

**Read these files (auto-load into context)**

- The change-review report file at the path provided in `$ARGUMENTS`
- @.agents/reference/repo_change_hygiene.md

## Process (PROCESS)

Follow these steps in order:

1. **Load scope from change-review report.**
   - Read the YAML report file at `$ARGUMENTS`.
   - Validate it is a well-formed change-review report (has `status`, `changed_files`, etc.).
   - From the flat list of changed file paths, exclude files that definitively cannot affect dependency declarations (e.g., documentation files, ignore files, data files).
   - If all changed files are excluded, skip to Step 4 and write the handoff with `status: success` and a summary indicating no relevant changes were found.

2. **Audit dependency declarations.**
   - Locate all dependency manifests in the repo (e.g., `requirements.txt`, `pyproject.toml`, `package.json`, `Dockerfile`, etc.).
   - For each changed file not excluded in Step 1, read its contents and identify any external packages or libraries it uses — whether through code imports, CLI tool invocations, build configurations, or any other usage pattern.
   - Compare identified dependencies against declared dependencies in manifests.
   - Flag:
     - External packages used but not declared in a manifest.
     - Unpinned production dependency versions where pinning is feasible.
     - Dev/prod dependency inconsistencies across environments.
   - Record all required changes: file edits (manifest entries to add/remove/pin) and system commands (package manager operations like `uv lock`, `npm install`, `pip freeze`).

3. **Audit lockfiles.**
   - Locate lockfiles (e.g., `uv.lock`, `package-lock.json`, `poetry.lock`, `Pipfile.lock`, etc.).
   - Check whether lockfiles are present when a corresponding manifest exists.
   - Check whether lockfiles appear stale relative to manifest changes detected in Step 2.
   - Lockfiles must never be manually edited. If a lockfile needs regeneration, record the regeneration command.

4. **Write the structured agent handoff.**
   - Review all recorded changes from Steps 2–3.
   - Do **not** apply any changes.
   - Package **all** required changes into the layout the Saved File section gives.
   - If no issues were found, produce the handoff with `status: success` and a summary indicating no issues were found.
   - Write the handoff file as the Saved File section describes.

5. **Return the final response as the Output section describes.**

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.

**Quality/Safety constraints**

- Do not modify any files other than the handoff file.
- Do not execute package manager commands, build commands, or test commands.
- Stage nothing and commit nothing.

## Saved File (OUTPUT)

- **Path**: `docs/reviews/deps-review-<rest>.yaml`
- **Naming rule**: Take the filename of the report at `$ARGUMENTS` and replace its leading `change-review` with `deps-review`, keeping the rest as `<rest>`, so that `change-review-2026-03-30-143022.yaml` gives `deps-review-2026-03-30-143022.yaml`. Create `docs/reviews/` if it does not exist.
- **Written for**: a later command.
- **If the file already exists**: Replace it.

**Layout**

A single structured block that another agent can execute without conversation context. Include only non-empty fields. Omit empty lists/objects entirely.

```yaml
source_review: deps-review
status: # success | partial | blocked
summary: # one sentence describing what was audited and what needs to happen next

file_changes:
  # File edits the downstream agent must apply, in order (omit if none)
  - path: # relative path to the file to edit
    change_type: # create | modify
    instructions:
      -  # explicit edit instruction (e.g., "Add 'newpackage==1.2.3' to requirements.txt")
      -  # one instruction per discrete change

actions:
  # System commands the downstream agent must execute, in order (run after file_changes)
  - cwd: # working directory (repo-relative or absolute)
    run: # exact shell command to execute
    expected_outcome: # what success looks like (exit code, file updated, output pattern)
    on_failure: # what to check or do if the command fails


# Optional (include only when relevant)

# assumptions:
#   - # assumption made during the audit

# blockers:
#   - # what is blocking and what input is needed
```

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return the following, and repeat nothing that is in the file:

- **Status**: `Success`, `Partial` or `Blocked`, matching the `status` written to the file. If the file could not be written, `Blocked` with the reason.
- **File**: the absolute path of the saved file, on its own line
- **Questions (only if blocked)**: numbered list
