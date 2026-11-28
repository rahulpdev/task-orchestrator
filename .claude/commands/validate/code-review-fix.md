---
description: Fix actionable issues from a code review report or manual issue description one by one, write and run tests for each fix, run final project validation, write a report of exactly what changed, then have the document-reviewer sub-agent read the report and correct its wording.
argument-hint: "<code-review-file-or-description> [scope] (required - path to a code review report file OR a description of the issues to fix; optional - focus area such as a directory, file, or feature to narrow the fixes)"
allowed-tools: Read, Edit, Write, Glob, Grep, Agent, Bash(mkdir:*), Bash(date:*), Bash(git:*), Bash(npm:*), Bash(pnpm:*), Bash(yarn:*), Bash(bun:*), Bash(uv:*), Bash(poetry:*), Bash(pip:*), Bash(python:*), Bash(pytest:*), Bash(ruff:*), Bash(mypy:*), Bash(go:*), Bash(cargo:*), Bash(mvn:*), Bash(gradle:*), Bash(make:*), AskUserQuestion
---

# /code-review-fix: Fix Code Review Issues

## Philosophy (Why this exists)

A code review is only useful when its findings get turned into real, verified fixes. This command takes the output of `/technical-code-review`, or a clearly described manual issue, fixes only the stated problems one at a time — proves each fix with the narrowest relevant test — and then runs the project's validate command so the whole codebase is checked once everything is done.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/code-review-fix docs/reviews/code-review-2026-04-30-143000.md`
- `/code-review-fix docs/reviews/code-review-2026-04-30-143000.md src/auth`
- `/code-review-fix "I ran the app manually and noticed none of the tools are working. Please fix it."`
- `/code-review-fix "Login accepts expired tokens" src/auth`

**Arguments received**

- Positional: `$1`, `$2`

**Arguments policy**

- **Mandatory**: `$1` is required. `$2` is optional.

**Argument contract**

- Required args: `$1` = a code review report file path OR a free-form description of the issue(s) to fix
- Optional args: `$2` = scope limiter, such as a directory, file path, feature area, or list of issue numbers to focus on
- Defaults: When `$2` is omitted, address every actionable issue from `$1`
- Validation rules:
  - If `$1` looks like a file path, the file must exist and be readable; read it in full before planning fixes.
  - If `$1` looks like a file path but the file does not exist, stop and ask for the correct path.
  - If `$1` is not a file path, treat it as a manual issue description.
  - If `$2` is provided, do not edit code outside that scope unless an issue cannot be fixed safely without doing so; ask before expanding scope.
  - Do not invent issues that are not in `$1`.

**If arguments are missing/invalid**

- If `$1` is missing, stop and ask for a code review file path or an issue description.
- If `$1` is a description but is too vague to map to files or expected behavior, stop and ask for the missing details.
- If the requested scope in `$2` conflicts with the issues in `$1`, stop and ask which source should control.

## Context to Load (INPUT)

**Read these files (auto-load into context)**

- The code review report at `$1` when `$1` is an existing file path
- `.claude/commands/validate/validate.md` when it exists, for final validation instructions

**Capture live state**

!`git status --short`
!`git diff --name-only`

## Process (PROCESS)

Follow these steps in order:

1. **Resolve the review input.**
   - If `$1` is an existing file, read it in full before extracting issues.
   - If `$1` is not a file, treat it as a manual issue description and record it verbatim as the source of truth for fixes.
   - If the input is a code review report that says no issues were found, do not change any code and proceed to Step 8 with `Status: Success`.

2. **Establish the worktree baseline.**
   - Run `git status --short` and `git diff --name-only`.
   - Identify files already changed before this command starts.
   - Preserve those unrelated changes; do not revert, overwrite, stage, commit, push, or merge them.

3. **Extract actionable issues.**
   - Convert the review input into a numbered issue list.
   - For each issue, capture the severity (when given), file path, line number, what is wrong, the expected behavior, and any suggested fix from the report.
   - Ignore review notes that are not concrete defects or requested fixes.
   - If `$2` is provided, drop any issues outside that scope from the list.
   - If an issue cannot be mapped to real code after reading the relevant files, stop and ask for clarification before editing.

4. **Plan each fix before touching code.**
   - Read each affected file in full.
   - Read nearby tests, imports, exports, data contracts, and call sites needed to understand the issue.
   - Decide the smallest coherent change that resolves the issue.
   - Decide the targeted test or verification command that will prove the fix before editing.
   - Order the fixes so prerequisite or shared-code fixes happen before dependent ones.

5. **Apply each fix one by one.**
   - Implement only the code changes needed for the current issue.
   - For each fix, in order:
     1. Explain what was wrong (reference file path and line numbers).
     2. Make the edit.
     3. Add or update a relevant test when the repository has a suitable test setup.
     4. Run the targeted test or verification command chosen in Step 4 and record the result.
   - Keep existing style, naming, and framework patterns.
   - Do not introduce new dependencies unless the issue cannot be fixed safely without one; ask before adding a dependency.
   - If a targeted test fails, fix the implementation or the test and re-run until it passes or a real blocker is identified.
   - If one issue is blocked but later issues are independent, continue with the independent issues and report the blocker.

6. **Run final validation.**
   - If `.claude/commands/validate/validate.md` exists, follow that command after all attempted fixes.
   - If no validate command exists, run the broadest safe project-local validation available (test command, lint, type check) based on package scripts or documented commands.
   - If no safe validation command can be identified, report that final validation could not be run and explain what is missing.
   - If final validation fails, fix failures introduced by this command and re-run; if a failure is unrelated or cannot be fixed safely, set `Status: Partial` and document it.

7. **Inspect the final diff.**
   - Run `git status --short` and review the files this command changed.
   - Confirm every changed file is tied to a fixed issue, an added/updated test, or a validation requirement.
   - If an unexpected file changed, inspect it and either explain why it was required or stop and ask how to proceed.

8. **Write the completion report.**
   - Use the layout in the Saved File section.
   - Include the original issue numbers from the review report when available.
   - For each fixed issue, explain what was wrong, show the fix with file references and a concise code or diff summary, and list the test command that verified it.
   - List any issues that were intentionally not fixed and explain why (e.g., already resolved, not a real defect, deferred per documentation).
   - Ensure the `docs/reviews/` directory exists.
   - Write the report as the Saved File section describes.

9. **Run the document review.**
   - Start the `document-reviewer` sub-agent once, using the agent spawning tool with `subagent_type|agent_type: "document-reviewer"`, and pass it two paths and nothing else: the communication standard at `.agents/reference/communication-standard.md` and the report written in Step 8.
   - Follow the instruction that closes its response, using Edit on the report file only.
   - Correct wording only. Do not change which issues are recorded as fixed or not fixed, a test or validation result, or a file reference, and ignore any finding against a field name the Saved File section fixes.
   - If the sub-agent cannot be started, or reports that it is blocked, leave the report as written in Step 8 and say so in the final response.

10. **Return the final response.**
    - Use the Human-Readable Report in the Output section.

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.
- If a review finding is plausible but no longer matches the current code, do not change code; explain the mismatch in the report.

**Quality/Safety constraints**

- Fix only the issues from `$1`, narrowed by `$2` when present.
- Preserve unrelated worktree changes.
- Do not stage files, commit, push, or merge.
- Do not perform broad refactors, formatting-only sweeps, or opportunistic cleanups outside the listed issues.
- Do not skip targeted tests for fixed issues unless no test harness exists or the issue is not testable in this repository.
- Do not mark the task complete unless each attempted fix has a test result, validation result, or documented blocker.

## Saved File (OUTPUT)

- **Path**: `docs/reviews/<report-name>.md`
- **Naming rule**: `<report-name>` is taken from the review input. If `$1` is a file whose name begins with `code-review`, replace that leading `code-review` with `code-review-fix` and keep the rest, so that `code-review-2026-04-30-143000.md` gives `code-review-fix-2026-04-30-143000.md`. Otherwise use `code-review-fix-<YYYY-MM-DD-HHMMSS>.md`, taking the time from `date '+%Y-%m-%d-%H%M%S'`.
- **Written for**: a human.
- **If the file already exists**: Save under a new name, adding the run's date and time, from `date '+%Y-%m-%d-%H%M%S'`, before `.md`.

**Layout**

Write a concise, easy-to-scan summary:

- **Title**: a first-level heading, `# Code Review Fix Report`, then the date and time
- **Status**: Success | Partial | Blocked
- **Review input**: file path or manual issue description used as the source of fixes
- **Scope**: scope applied from `$2`, or `Full review input`
- **Issues fixed**: for each issue, list:
  - Issue number (from the report when available)
  - What was wrong (with file path and line)
  - What changed (file references and a short summary of the fix)
  - Test command that verified it and pass/fail result
- **Issues not fixed**: any issues skipped or deferred and the detailed reason (e.g., already resolved, not a real defect, deferred per documentation, blocker)
- **Final validation**: validation command used and pass/fail/not-run result
- **Files changed**: files modified or created by this command
- **Assumptions**: explicit assumptions made during the run
- **Risks / gotchas**: only real remaining risks or test gaps
- **Next steps**: follow-up actions needed before commit

The saved file contains only the parts above. Explain a term inside the part where it first appears.

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return a concise summary. Beyond the items below, repeat nothing that is in the file:

- **Status**: `Success`, `Partial` or `Blocked`. Give the reason with `Blocked`, including when the file could not be written.
- **File**: the absolute path to the completion report, on its own line.
- **Final validation**: pass, fail or not run.
- **Document review**: what the document-reviewer's closing instruction says to tell the user, or that the review did not run.

## Notes

- This command is designed to consume the report produced by `/technical-code-review`, but it also accepts a clearly described manual issue when the user has spotted a problem during testing.
- Final validation should be a single comprehensive sweep over the codebase so the user knows the fixes did not break anything else.
- The `document-reviewer` sub-agent must be present in `.claude/agents/`, or the document review in Step 9 cannot run.
