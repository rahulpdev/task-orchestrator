---
description: Combine two existing change-review reports, then write one downstream-compatible combined change-scope report.
argument-hint: "<first-report-path> <second-report-path> [-- additional context]"
allowed-tools: Read, Glob, Bash(mkdir:*), Bash(date:*), Write, AskUserQuestion
---

# /combine-change-review: Combine Change-Review Reports

## Philosophy (Why this exists)

Review commands need one clear scope of what changed. When changes span two sources, they need to be reconciled. This command owns that responsibility: it merges scopes without losing origin metadata or silently changing the reviewed scope.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/combine-change-review docs/reviews/change-review-a.yaml docs/reviews/change-review-b.yaml`
- `/combine-change-review docs/reviews/change-review-a.yaml docs/reviews/change-review-b.yaml -- focus backend review notes, but record any scope filtering`

**Arguments received**

- Positional report args before `--`: `$1`, `$2`
- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Mandatory**: `$1` and `$2` are required. If missing or invalid, stop and ask.

**Argument contract**

- Required args:
  - `$1` = first change-review report YAML file (produced by `/change-review`)
  - `$2` = second change-review report YAML file (produced by `/change-review`)
- Optional args: additional context after a standalone `--`
  - The standalone `--` separates report paths from free-form context so context words are not mistaken for extra report paths.
- Defaults: None
- Validation rules:
  - Accept exactly two report paths before `--`.
  - Do not accept more than two report paths.
  - Each provided report path must exist, be readable, and be a valid change-review YAML report.

**If arguments are missing/invalid**

- If `$1` is missing, stop and ask for the first report path.
- If `$2` is missing, stop and ask for the second report path. If the user needs a report for current changes, tell them to run `/change-review` first, then rerun this command with both report paths.
- If more than two report paths are provided, stop and ask which two reports to combine.
- If a provided report is missing, unreadable, malformed, or has no changed files, stop and ask for a valid change-review report path.

## Context to Load (INPUT)

**Read these files (auto-load into context)**

- The change-review report file at `$1`
- The change-review report file at `$2`

## Process (PROCESS)

Follow these steps in order:

1. **Parse the invocation.**
   - Split `$ARGUMENTS` at the first standalone `--`.
   - Treat tokens before `--` as report paths.
   - Treat all text after `--` as additional context, not as report paths.
   - If `$1` or `$2` is missing, stop and ask for the missing report path.
   - If more than two report paths appear before `--`, stop and ask which two reports to combine.

2. **Validate provided report scopes.**
   - Read the first report at `$1`.
   - Read the second report at `$2`.
   - For each provided report, validate that it parses as change-review YAML with:
     - `status`, `summary`, `timestamp`, and `scope_source`.
     - `changed_files` as a non-empty list of repo-relative path strings.
   - Validate that each report's `changed_files` list is deduplicated.
   - If any provided report fails validation, stop and ask for a corrected report path. Do not guess missing scope from an invalid report.

3. **Combine the two scopes.**
   - Merge the first scope's paths with the second scope's paths.
   - Deduplicate the merged paths and sort them alphabetically.
   - For every merged path, record which source or sources included it:
     - `first_report`
     - `second_report`
   - Carry forward source metadata, including `status`, `summary`, `timestamp`, and `scope_source` under `combined_sources`.
   - Combine `assumptions` and `blockers` from both sources into the top-level optional fields, labeling the originating source inline.
   - Compute the combined `status`:
     - `blocked` if either source is `blocked`.
     - Otherwise `partial` if either source is `partial`.
     - Otherwise `success`.
   - Use additional context only to focus, label, or interpret the combined scope.
   - If additional context narrows, filters, or changes interpretation of the report-derived scope, record that explicitly under `context_adjustments`. If files are excluded because of the context, record them under `excluded_files` with their original origins and the reason.
   - If additional context conflicts with the report-derived scope and cannot be applied without guessing, set `status: partial` and record the conflict under `assumptions` or `blockers`.

4. **Write the combined report file as the Saved File section describes.**

5. **Return the final response as the Output section describes.**

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.
- Do not silently override report-derived scope with additional context.

**Quality/Safety constraints**

- Do not modify any files other than the combined report file.
- Do not stage, commit, push, merge, or reset anything.
- Do not derive missing scope from Git. If either report path is missing, stop and ask for it.

## Saved File (OUTPUT)

- **Path**: `docs/reviews/change-review-combined-<YYYY-MM-DD-HHMMSS>.yaml`
- **Naming rule**: `<YYYY-MM-DD-HHMMSS>` is the date and time of the run. Create `docs/reviews/` if it does not exist.
- **Written for**: a later command.
- **If the file already exists**: Replace it.

**Layout**

Include only non-empty fields. Omit empty lists/objects entirely.

```yaml
status: # success | partial | blocked
summary: # one sentence describing the combined scope
timestamp: # ISO 8601 timestamp of when this combined report was generated
scope_source: # e.g., "combined from two change-review reports"

changed_files:
  -  # relative path to changed file
  -  # one entry per changed file (deduplicated, sorted alphabetically)

combined_sources:
  first_report:
    path: # first-report-path
    status: # source report status
    summary: # source report summary
    timestamp: # source report timestamp
    scope_source: # source report scope_source
  second_report:
    path: # second-report-path
    status: # source report status
    summary: # source report summary
    timestamp: # source report timestamp, when available
    scope_source: # source report scope_source

file_origins:
  path/to/file.ext:
    - first_report
    - second_report

# Optional (include only when relevant)

# context_adjustments:
#   - type: # narrowed_scope | filtered_files | interpretation_only | conflict_recorded
#     reason: # include the relevant user context after -- and explain how it affected the report
#     affected_files:
#       - # path affected by the adjustment
#
# excluded_files:
#   - path: # file removed from final changed_files because of explicit additional context
#     original_origins:
#       - # first_report | second_report
#     reason: # include the relevant user context after -- and explain why it was excluded
#
# assumptions:
#   - # assumption made during validation or combining
#
# blockers:
#   - # what is blocking and what input is needed
```

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return the following, and repeat nothing that is in the file:

- **Status**: `Success`, `Partial` or `Blocked`, matching the `status` written to the file. If the file could not be written, `Blocked` with the reason.
- **File**: the absolute path of the saved file, on its own line
- **Questions (only if blocked)**: numbered list
