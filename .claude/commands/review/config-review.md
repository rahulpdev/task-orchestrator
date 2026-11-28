---
description: Audit runtime configuration definitions and usage against scoped code changes; write a structured agent handoff with all required updates for a downstream agent to execute.
argument-hint: "<report-path> (required - path to change-review report YAML file)"
allowed-tools: Read, Glob, Grep, Bash(mkdir:*), Write, AskUserQuestion
---

# /config-review: Pre-Merge Configuration Audit

## Philosophy (Why this exists)

Configuration can drift or become unsafe when code changes introduce new settings, rename existing ones, or shift environment assumptions. This command catches those gaps. It is purely diagnostic — it operates on the structured output of `/change-review`, which establishes the scope of changes in the codebase, and it produces a structured handoff for a downstream agent to execute any required fixes. This creates a clean separation of concerns: this command diagnoses, another command fixes.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/config-review docs/reviews/change-review-2026-03-30-143022.yaml`

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
   - From the flat list of changed file paths, exclude files that definitively cannot affect configuration (e.g., images, static assets, data files).
   - If all changed files are excluded, skip to Step 5 and write the handoff with `status: success` and a summary indicating no configuration-impacting changes were found.

2. **Map configuration sources touched by the change.**
   - Identify configuration artifacts in the repo: `.env*` files (including examples), `config/` directories, `settings.*`, `*.yml`/`*.yaml`/`*.json`/`*.toml` configs, `docker-compose*.yml`, Helm charts/values, CI/CD workflow env definitions, and language-specific config modules.
   - For each changed file not excluded in Step 1, read its contents and extract configuration keys, env var names, and settings references (e.g., `process.env.*`, `os.getenv`, config objects, flags passed to CLIs).
   - Build a deduplicated list of referenced configuration keys and the files that reference or define them.

3. **Validate definitions, naming, and alignment across environments.**
   - For each referenced key, confirm it is defined in the appropriate configuration source(s) (e.g., `.env.example`, local env files, CI secrets, production values, Helm values, compose env). Flag any missing definitions or stale/unused keys.
   - Check naming consistency (uppercase with underscores for env vars; avoid mixed casing or ambiguous prefixes). Flag keys that collide, conflict, or diverge in spelling between code and config files.
   - Evaluate defaults and safety: flag unsafe defaults (`DEBUG=true` in production paths, empty secrets, permissive origins), type mismatches (string vs boolean/numeric), and environment-specific mismatches (e.g., present in CI but missing locally or vice versa).

4. **Check documentation and operational readiness.**
   - Determine whether new or changed configuration requires README or other docs updates. Flag missing setup instructions, migration notes, or examples for local/CI/production.
   - Ensure configuration samples use placeholders (not real secrets) and note where each secret must live (local env file, CI secret store, production secret manager).
   - Note required rotations or follow-up tasks (e.g., update CI secrets store, refresh deployment config) as explicit instructions.

5. **Write the structured agent handoff.**
   - Review all recorded changes from Steps 3-4.
   - Do **not** apply any changes.
   - Package **all** required changes into the layout the Saved File section gives.
   - If no issues were found, produce the handoff with `status: success` and a summary indicating no configuration issues were found.
   - Write the handoff file as the Saved File section describes.

6. **Return the final response as the Output section describes.**

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.

**Quality/Safety constraints**

- Do not modify any files other than the handoff file.
- Do not execute configuration, deployment, or secret-management commands.
- Stage nothing and commit nothing.

## Saved File (OUTPUT)

- **Path**: `docs/reviews/config-review-<rest>.yaml`
- **Naming rule**: Take the filename of the report at `$ARGUMENTS` and replace its leading `change-review` with `config-review`, keeping the rest as `<rest>`, so that `change-review-2026-03-30-143022.yaml` gives `config-review-2026-03-30-143022.yaml`. Create `docs/reviews/` if it does not exist.
- **Written for**: a later command.
- **If the file already exists**: Replace it.

**Layout**

A single structured block that another agent can execute without conversation context. Include only non-empty fields. Omit empty lists/objects entirely.

```yaml
source_review: config-review
status: # success | partial | blocked
summary: # one sentence describing what was audited and what needs to happen next

file_changes:
  # File edits the downstream agent must apply, in order (omit if none)
  - path: # relative path to the file to edit (e.g., ".env.example", "config/settings.yml", "README.md")
    change_type: # create | modify
    instructions:
      -  # explicit edit instruction (e.g., "Add APP_BASE_URL to .env.example with placeholder and note required value")
      -  # one instruction per discrete change

actions:
  # System or platform actions the downstream agent must execute, in order (run after file_changes)
  # Examples: update CI secret, rotate token, regenerate config bundle, restart service with new env var
  - cwd: # working directory (repo-relative or absolute)
    run: # exact shell command or platform action (use descriptive text if external, e.g., "Add APP_BASE_URL to GitHub Actions secrets")
    expected_outcome: # what success looks like (e.g., secret present, config regenerated, service picks up new setting)
    on_failure: # what to check or do if the action fails


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
