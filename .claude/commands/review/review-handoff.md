---
description: Merge and apply the structured review handoffs for one change-review report, requiring the complete review set before resolving overlapping file instructions, escalating conflicts and running follow-up actions.
argument-hint: "<report-path> (required - path to the change-review report YAML file the four reviews audited)"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(git:*), Bash(npm:*), Bash(pnpm:*), Bash(yarn:*), Bash(bun:*), Bash(uv:*), Bash(pip:*), Bash(poetry:*), AskUserQuestion
---

# /review-handoff: Apply Review Handoffs

## Philosophy (Why this exists)

Structured review handoffs are useful only when their instructions are merged against the current repository state before execution. This command is intentionally coupled to a shared handoff contract, while also requiring the complete expected review set so omissions are caught before edits begin. Every applied edit traces back to its source review, every conflict has a recorded decision, and nothing is silently synthesized or applied out of sequence.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/review-handoff docs/reviews/change-review-2026-03-30-143022.yaml`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Mandatory**: `$ARGUMENTS` is required. If missing or invalid, stop and ask.

**Argument contract**

- Required args: `$ARGUMENTS` = path to the change-review report YAML file that the four reviews audited
- Optional args: None
- Defaults: None
- Validation rules: The filename must begin with `change-review`.

**If arguments are missing/invalid**

- Stop and ask the user for the report path. Suggest running `/change-review` and the four reviews first if no report exists.

## Context to Load (INPUT)

**Read these files (auto-load into context)**

- The four handoff files named after the report at `$ARGUMENTS`, one from each required review source:
  - `hygiene-review`
  - `deps-review`
  - `config-review`
  - `docs-review`
- Each handoff must include:
  - `source_review`
  - `status`
  - `summary`

**Optional: capture live state (auto-run bash, if allowed)**

- !`git status --short`
- !`git diff --name-only`

## Process (PROCESS)

Follow these steps in order:

1. **Resolve and validate handoff inputs.**
   - For each required source, replace the leading `change-review` in the filename of the report at `$ARGUMENTS` with the source's name, so that `change-review-2026-03-30-143022.yaml` gives `hygiene-review-2026-03-30-143022.yaml`.
   - Read the four handoff files of those names in `docs/reviews/`.
   - Validate each handoff has `status`, `summary`.
   - If any required handoff file is missing, any `source_review` value is unknown, or any handoff is malformed, stop and report the exact source(s) that must be run or corrected before proceeding. `hygiene-review` writes no handoff when it finds a secret.

2. **Apply hard stops before planning.**
   - If any handoff has `status: blocked`, stop and report the blocker(s).
   - If any handoff mentions exposed secrets, plaintext credentials, API keys, tokens, or required credential rotation, stop and alert the user before making changes.
   - If any handoff includes unclear instructions that cannot be safely mapped to file edits or actions, stop and ask a targeted question.

3. **Normalize all requested work.**
   - Extract every `file_changes` item, preserving the contributing `source_review` for traceability.
   - Extract every `actions` item, preserving the contributing `source_review` for traceability.
   - For singleton entries, preserve `source_review`.
   - For merged entries, preserve a `merged_from` record containing each contributing `source_review` and original instruction.
   - Ignore successful handoffs that contain no `file_changes` or `actions`.
   - Reject any `file_changes` item that lacks `path`, `change_type`, or concrete `instructions`.
   - Reject any `actions` item that lacks `cwd`, `run`, `expected_outcome`, or `on_failure`.

4. **Group requested work by target.**
   - Group all `file_changes` by `path`.
   - Group all `actions` by `(cwd, run)` equivalence.
   - Apply section-level grouping within known hot collision files such as `README.md` and `.env.example`, not just file-level grouping.

5. **Classify and consolidate grouped instructions.**
   - Classify same-file instructions as one of:
     - `duplicate`: semantically equivalent recommendations; collapse into one edit using the clearest phrasing.
     - `additive`: overlapping recommendations where each adds distinct nuance; merge into one instruction that preserves the supported union.
     - `complementary`: compatible edits to different sections or keys; keep both in one per-file plan.
     - `order-dependent`: compatible edits where one must be applied before another; sequence them explicitly.
     - `conflict`: incompatible edits to the same section, key, value, or generated artifact; route to the conflict-resolution step.
   - When uncertain between `additive` and `conflict`, treat the pair as `conflict`.
   - For every merged or singleton entry, keep traceability faithful to the originals and do not rewrite beyond what the contributing handoffs support.
   - Do not apply any same-file instruction sequentially as emitted until the full per-file group has been reviewed and consolidated.

6. **Resolve or escalate conflicts.**
   - For each `conflict` from Step 5, resolve it only when the authoritative source is clear:
     - `hygiene-review` for secrets, ignore lists, and tracked-file cleanup.
     - `deps-review` for dependency manifests, versions, and lockfiles.
     - `config-review` for environment variables, runtime settings, and configuration samples.
     - `docs-review` for README placement, wording, and documentation structure.
   - If the authoritative source is clear, record the chosen instruction, rejected instruction, and reason for the final report.
   - If source authority is unclear or repository evidence does not support a safe choice, stop and ask.

7. **Sequence the full execution plan.**
   - Apply `hygiene-review` ignore-list and tracked-file cleanup edits before dependency, configuration, or documentation edits.
   - Apply `deps-review` dependency manifest edits before lockfile regeneration actions.
   - Apply `config-review` configuration sample and config-source edits before README documentation edits.
   - Apply `docs-review` README and documentation edits after the underlying manifest/config edits they describe.
   - Within a same-path group, respect any `order-dependent` classifications before source-review ordering.
   - Apply all `file_changes` before any `actions`.
   - Run system actions only after all applicable file edits have been applied.

8. **Apply consolidated file edits.**
   - Read the current contents of each target file immediately before editing it.
   - For `change_type: create`, create the file only if it does not already exist; if it exists, treat the requested change as a modify operation and preserve existing content.
   - For `change_type: modify`, stop if the target file does not exist unless the handoff explicitly allows creating it.
   - For `change_type: delete`, delete only when the handoff explicitly prescribes deletion; otherwise treat the request as an untrack action or stop and ask.
   - Make the smallest coherent edit that satisfies the consolidated instructions.
   - Preserve unrelated user changes and existing style.
   - Do not manually edit lockfiles or generated files when the correct handoff action is to regenerate them with a package manager or build tool.

9. **Run approved actions.**
   - Run actions in the order established in Step 7.
   - Run only repository-local package-manager or Git actions that are concrete, expected by the handoffs, and allowed by this command's tool permissions.
   - Do not run external platform actions, deployment actions, secret-management actions, destructive cleanup commands, ambiguous shell commands, or broad validation suites.
   - For every skipped action, preserve the original action context from the handoff, add the reason it was skipped, and state what the user must do next.
   - If an action fails, follow its `on_failure` instruction, report the failure, and stop before running later dependent actions.

10. **Review the resulting repository diff.**

- Run `git status --short` and `git diff --name-only`.
- Confirm the changed files match the consolidated execution plan.
- If unexpected files changed, inspect the diff and either explain why the change is expected or stop and ask how to proceed.

11. **Produce the final report.**

- Return the human-readable report defined in the Output section.
- Summarize which source reviews were consumed.
- List files changed and actions run.
- List skipped or manual actions with reasons.
- List any unresolved blockers or follow-up validation needed.

**Decision discipline**

- If you must make assumptions: list them explicitly.
- If blocked by missing info: stop and ask targeted questions.
- If two handoffs are individually reasonable but jointly ambiguous, stop before changing the affected file.

**Quality/Safety constraints**

- Do not stage files, commit, push, or merge.
- Do not run broad validation suites unless an action explicitly requires a narrow regeneration or package-manager command.
- Do not apply same-file handoff instructions sequentially without first merging them into a single per-file plan.
- Do not manually edit lockfiles or generated files when a regeneration action is appropriate.
- Do not run external secret-management, deployment, or production-impacting actions.
- Preserve unrelated changes already present in the worktree.

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return a concise, easy-to-scan summary:

- **Status**: Success | Partial | Blocked
- **Handoffs applied**: source reviews consumed, with each handoff's path and status
- **Merge summary**: counts for duplicate, additive, complementary, order-dependent, and conflicting items
- **Conflicts auto-resolved**: target, chosen source review and instruction, rejected source review and instruction, and one-sentence reason grounded in the handoffs
- **Conflicts user-resolved**: target, chosen source review and instruction, rejected source review and instruction, question asked, and user's answer
- **What changed**: files edited, grouped by purpose, with source review attribution for singleton and merged changes
- **Actions run**: commands executed, with source review attribution and success/failure outcome
- **Skipped/manual actions**:
  - **Source review**: review that prescribed the action
  - **Action**: original action or platform instruction
  - **Reason skipped**: why this command did not run it
  - **Expected outcome**: what successful manual completion looks like
  - **Follow-up guidance**: what to do if manual completion fails or is unavailable
  - **Blocks**: validation | merge | deployment | none | unknown
- **Unexpected diff entries**: files changed outside the consolidated plan, with explanation
- **Assumptions**: explicit assumptions made during the run
- **Risks / gotchas**: overlapping edits resolved, conflicts found, or assumptions made
- **Next steps**: validation commands or targeted follow-up needed
- **Questions (only if needed)**: numbered list
