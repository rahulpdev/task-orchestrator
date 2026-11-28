---
description: Audit an implementation against its source plan, identify missed or incomplete plan items with plain-language severity and remediation guidance, write a human-readable report to `docs/reviews/`, then have the document-reviewer sub-agent read the report and correct its wording.
argument-hint: "[audit context] (optional - plan path, commit/range, scope, or report-name hint)"
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(mkdir:*), Bash(date:*), Write, Edit, Agent, AskUserQuestion
---

# /execution-audit: Execution Audit

## Philosophy (Why this exists)

Treat the plan as the standard of record. Do not credit work as complete unless the implementation evidence supports it, and do not hide gaps behind technical wording. The final report must make sense to a reader who does not inspect code.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/execution-audit`
- `/execution-audit docs/plans/add-export-flow.md`
- `/execution-audit plan docs/plans/add-export-flow.md review git range abc123..def456`
- `/execution-audit focus on auth changes; report name: auth-refresh`

**Arguments received**

- Everything typed after the command's name (its arguments), as a single piece of text: `$ARGUMENTS`

**Arguments policy**

- **Optional**: `$ARGUMENTS` may be omitted. If omitted, derive the plan and implementation scope from the current conversation context plus current Git state.

**Argument rules**

- Required arguments: None
- Optional arguments: `$ARGUMENTS` = free-form audit context, such as a plan file path, one or more commit hashes (a commit is a change saved in Git, and its hash is the short code that names it), a commit range (every commit from one to another), a directory focus, or `report name: <slug>`, which sets the slug, the short name used in the report's file name
- Defaults: When omitted, use the active conversation context to identify the plan, and use the current changes not yet committed as implementation evidence: those marked for the next commit (staged), those not yet marked (unstaged), and new files Git is not yet keeping.
- Validation rules:
  - Any referenced plan path must lead to a readable file.
  - Any referenced commit hash or range must be found in Git.
  - Do not combine a list of single commits with a range of commits unless the user explicitly clarifies the intended scope.
  - If `report name: <slug>` is provided, rewrite it as lowercase words joined by hyphens before using it in the report filename.

**If arguments are missing/invalid**

- If omitted, proceed only if the current conversation clearly contains one source plan and one implementation scope.
- If the plan, implementation scope, or Git reference is ambiguous, stop and ask a targeted question before writing the audit report.
- If a referenced file, commit, or range cannot be found, stop and ask for a corrected value.

## Context to Load (INPUT)

**Capture the current state of the repository** (when the command starts, the line below runs `git status`, which lists the changed and new files, and puts what it prints in its place)

- !`git status`

## Process (PROCESS)

Follow these steps in order:

1. **Work out the audit inputs.**
   - Identify the source plan from `$ARGUMENTS` or the current conversation context.
   - Identify the implementation scope from `$ARGUMENTS`, the current conversation context, and Git state.
   - If more than one plan or implementation scope could reasonably apply, stop and ask which one to audit.
   - Identify the report slug from `report name: <slug>` if supplied; otherwise derive it from the plan filename or plan title. If no stable slug exists, use `execution-<YYYY-MM-DD-HHMMSS>`.

2. **Read the complete plan.**
   - Read the plan from beginning to end if it exists as a file.
   - If the plan exists only in conversation context, reconstruct it from that context and state this as an assumption in the report.
   - Extract a checklist of every explicit plan obligation, including implementation tasks, acceptance criteria, testing requirements, validation commands, documentation updates, constraints, and any stated non-goals.
   - Preserve the plan's meaning; do not merge separate obligations just to shorten the audit.

3. **Collect implementation evidence.**
   - Capture the selected Git scope:
     - If `$ARGUMENTS` references one or more commits, run `git show --stat --name-status <commit...>`, which lists the files each commit changed, and `git show <commit...>`, which shows the changes themselves.
     - If `$ARGUMENTS` references a range, run `git diff --stat --name-status <range>`, which lists the files changed across the range, and `git diff <range>`, which shows the changes themselves.
     - If no commit or range is provided, run `git diff HEAD`, which shows every change since the last commit, `git diff --stat HEAD`, which lists the files those changes touch, and `git ls-files --others --exclude-standard`, which lists new files Git is not yet keeping, leaving out any the repository is set to ignore.
   - Read each changed source, test, configuration, and documentation file needed to judge plan adherence.
   - Use conversation evidence for claimed test runs, validation results, explicit deviations, and skipped work.
   - If evidence is unavailable for a plan item, mark it `Unverifiable`; do not assume it was completed.

4. **Compare the implementation against the plan item by item.**
   - For each plan obligation, assign exactly one status:
     - `Implemented`: direct evidence shows the plan item was completed.
     - `Partially implemented`: evidence shows some, but not all, of the plan item was completed.
     - `Missing`: no implementation evidence supports the plan item.
     - `Skipped`: evidence shows the item was knowingly not done.
     - `Unverifiable`: available evidence is insufficient to make a fair judgment.
     - `Not applicable`: the plan item no longer applies, and the reason is supported by evidence.
   - Record the evidence used for the status in plain language.
   - Treat missing tests, skipped validation commands, and omitted documentation as plan-adherence gaps when the plan required them.
   - Treat implementation outside the plan as a risk or assumption unless the plan allowed that deviation.

5. **Assess severity for every gap.**
   - Use plain-language severity labels:
     - `Critical`: the main promise of the plan is not delivered, or the gap creates serious security, data-loss, or release-blocking risk.
     - `High`: an important requirement is absent or incomplete and likely blocks users, release, or maintainability.
     - `Medium`: the work is meaningfully incomplete, but the main flow may still work with limits or follow-up.
     - `Low`: the gap is minor, mostly polish, documentation, narrow test coverage, or process cleanup.
   - For each non-implemented item, explain why the severity was chosen without relying on code jargon.
   - Provide a remediation plan when action is appropriate; if no action is appropriate, explain why.

6. **Draft the human-readable audit report.**
   - Ensure the report can be understood by someone who does not read code.
   - Use file paths only as supporting evidence, and explain what each file means when the path is not self-explanatory.
   - Avoid unexplained acronyms, the inner workings of the libraries the code is built on, and line-by-line code commentary.
   - Be explicit about what was missed, overlooked, skipped, incomplete, or unverifiable.

7. **Write the report file.**
   - Run `mkdir -p docs/reviews`, which creates the folder for audit reports if it does not exist yet.
   - Write the report as the Saved File section describes.

8. **Review the report before responding.**
   - Re-read the report and confirm it is drafted for a non-code-reading audience.
   - Confirm every incomplete, missing, skipped, or unverifiable plan item has a severity assessment and remediation guidance when appropriate.
   - Confirm the report distinguishes evidence-backed findings from assumptions and unknowns.

9. **Have the report's wording checked.**
   - Start the `document-reviewer` sub-agent once, using the agent spawning tool with `subagent_type|agent_type: "document-reviewer"`, and pass it two paths and nothing else: the communication standard at `.agents/reference/communication-standard.md` and the report written in Step 7.
   - Follow the instruction that closes its response, using Edit on the report file only.
   - Correct wording only. Do not change a plan item's status, a severity, a count or the evidence cited, and ignore any finding against a heading or field name the Saved File section fixes.
   - If the sub-agent cannot be started, or reports that it is blocked, leave the report as written and say so in the final response.

10. **Handoff: produce the final response using the Human-Readable Report in the Output section.**

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.
- If a plan item is plausible but unproven, mark it `Unverifiable` rather than complete.

**Quality/Safety constraints**

- Do not modify source files, tests, documentation, configuration, or lockfiles (the files that record the exact version of every package).
- Only write the audit report under `docs/reviews/`.
- Do not stage files, commit files, push branches to GitHub, or open pull requests (requests on GitHub to merge one branch's changes into another).
- Do not run tests, builds, migrations (changes to the structure of stored data), deployments, or destructive commands; audit the available evidence instead.
- Do not soften or omit plan gaps to make the implementation look more complete.

## Saved File (OUTPUT)

- **Path**: `docs/reviews/<slug>-audit.md`
- **Naming rule**: `<slug>` is the report slug identified in Step 1. The file name ends with `-audit.md`.
- **Written for**: a human.
- **If the file already exists**: Replace it.

**Layout**

```markdown
# Execution Audit Report

**Plan reviewed:** <plan path, plan title, or conversation-derived plan>
**Implementation scope:** <current Git state | commits <hashes> | range <range> | focused scope>
**Status:** Success | Partial | Blocked
**Summary:** <one plain-language paragraph explaining the overall result>

## Bottom Line

- <the most important thing a non-technical reader should know>
- <whether the implementation appears to have followed the plan fully>
- <the highest-severity gap, if any>

## Severity Levels

- **Critical:** the main promise of the plan is not delivered, or the gap creates serious security, data-loss, or release-blocking risk.
- **High:** an important requirement is absent or incomplete and likely blocks users, release, or maintainability.
- **Medium:** the work is meaningfully incomplete, but the main flow may still work with limits or follow-up.
- **Low:** the gap is minor, mostly polish, documentation, narrow test coverage, or process cleanup.

## Outcome Counts

- Implemented: <count>
- Partially implemented: <count>
- Missing: <count>
- Skipped: <count>
- Unverifiable: <count>
- Not applicable: <count>

## Missed, Skipped, Or Incomplete Work

If no gaps were found, write:

No missed, skipped, or incomplete plan items were found from the available evidence.

If gaps were found, write one numbered section per gap:

### 1. <plain-language gap title>

- **Plan item:** <what the plan required>
- **What happened:** <what the implementation did or did not do>
- **Severity:** <Critical / High / Medium / Low>
- **Why this severity:** <plain-language explanation>
- **Remediation plan:** <specific next steps, or why no remediation is appropriate>

## Validation And Testing Evidence

- **Plan-required validation:** <commands/checks the plan required>
- **Evidence found:** <what was actually run or shown>
- **Missing evidence:** <required checks with no proof, or "None">

## Assumptions And Limits

- <assumptions made during the audit, or "None">
- <evidence limits, unknowns, or blocked checks, or "None">

## Readability Check

- **Audience check:** Pass / Needs revision
- **Notes:** <confirm the report avoids code-only explanations and is suitable for a reader who does not inspect the code>
```

The saved file contains only the parts in the structure above. Explain a term inside the part where it first appears.

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return a concise summary. Beyond the items below, repeat nothing that is in the file:

- **Status**: `Success`, `Partial` or `Blocked`. Give the reason with `Blocked`, including when the file could not be written.
- **File**: absolute path to the audit report
- **Highest severity found**: Critical | High | Medium | Low | None | Unknown
- **Document review**: what the document-reviewer's closing instruction says to tell the user, or that the review did not run
- **Questions (only if blocked)**: numbered list

## Notes

- This command audits adherence to a plan, not the technical quality of the code.
- The report is intentionally written for a non-coding stakeholder; preserve that audience when editing this command in the future.
- The `document-reviewer` sub-agent must be present in `.claude/agents/`, or the wording check in Step 9 cannot run.
