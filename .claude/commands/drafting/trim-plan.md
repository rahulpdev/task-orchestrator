---
description: Trim a substantively complete plan by removing prose padding without restructuring, targeting a >20% word-count reduction while preserving every technical detail, nuance, example, decision record, and every item the finished work is checked against; report a section-by-section audit with pre/post word counts.
argument-hint: <plan-filepath> (required - path to the plan markdown file to trim)
allowed-tools: Read, Edit, Bash(test:*), Bash(wc:*), Bash(basename:*)
---

# /trim-plan: Trim A Complete Plan Without Restructuring

## Philosophy (Why this exists)

Plans that go through multiple drafting and review passes accumulate prose padding (openings that delay the point, hedges, redundant restatements) while the essential content stays intact. This command exists to strip the padding without touching the content: trimming is not refactoring (reorganising or rewriting the plan). The plan is substantively complete and internally consistent; those decisions are settled, so do not reopen them. Word count is the target; content preservation is the constraint, not a co-target. If a candidate cut might remove meaning, leave it.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/trim-plan .agents/plans/add-user-authentication.md`
- `/trim-plan .agents/plans/artifacts/detect-pdf-table/detect-pdf-table-plan.md`

**Arguments received**

- Argument (the text given after the command's name): `$ARGUMENTS`

**Arguments policy**

- **Mandatory**: `$ARGUMENTS` is required.

**Argument rules**

- Required arguments: `$ARGUMENTS` = path to the plan markdown file.
- Optional arguments: None.
- Validation rules:
  - `$ARGUMENTS` must be a path to an existing readable file.
  - `$ARGUMENTS` must end in `.md`.

**If arguments are missing/invalid**

- If `$ARGUMENTS` is absent, stop and ask for the plan file path.
- If `$ARGUMENTS` does not exist or is unreadable, stop and ask for a valid path.

## Process (PROCESS)

Follow these steps in order:

1. **Validate the plan file.**
   - Capture the artifacts directory into a shell variable (a named value the later commands can read): `DIR="$ARTIFACTS_DIR"`. The artifacts directory is the folder Archon, the tool that can run this command as one step of a workflow, gives that run for its files; Archon supplies its path as `$ARTIFACTS_DIR`, which is empty when a person runs the command by hand.
   - If `$DIR` is non-empty, confirm the plan exists with `test -f "$DIR/plan.md"` (Archon workflow context); the plan source is `$DIR/plan.md`.
   - Otherwise, confirm the plan exists with `test -f "$ARGUMENTS"` (manual-invocation context); the plan source is `$ARGUMENTS`.
   - If the check fails, stop: under manual-invocation, ask for a valid path; under Archon, report the missing plan input and halt.

2. **Read the plan and capture the pre-trim baseline.**
   - Read the plan source from top to bottom.
   - Identify every section (top-level and sub-headings).
   - Record the pre-trim word count for each section and the file total (use `wc -w`, the command that counts the words in a file, for precision).
   - Identify the source skill's rules for what a plan holds (the source skill is the set of instructions Claude followed to write the plan) by inspecting the plan's frontmatter (the block of labelled fields at the top of the file), headings, and template structure: this is the benchmark for what belongs on the page.

3. **Identify targets for removal.**
   - Prose padding: verbose framing, openings that delay the point, hedging adverbs that don't change meaning, rhetorical asides.
   - Redundant restatement: prose that repeats the immediately preceding sentence or bullet.
   - Genuine cross-section duplication: content appearing in two or more sections; collapse to the most authoritative location and remove elsewhere.
   - Content beyond the source skill's rules: a section, an artifact (a separate piece of output, such as an extra file), or a level of detail that exceeds what the source skill required (presume it is excess, regardless of how coherent it reads).

4. **Preserve every essential element.**
   - Every technical detail the source skill called for: parameters (the values a function is given), constants (values worked out once and then fixed), signatures (a function's name and what it takes and gives back).
   - Every nuance: caveats, GOTCHAs (notes warning of an easy mistake), mentions of unusual cases and what goes wrong in them, race-window notes (about a moment when two things running at once could clash), the cases where code refuses when it cannot read its input, and trust-boundary language (about the trust boundary, the path every piece of outside text takes before a model sees it).
   - Every example, kept long enough to still illustrate the rule it serves.
   - Every decision record the source skill called for: the final `why we rejected X` / `why we chose Y` rationales exist so the next adversarial reviewer does not re-raise issues already deliberated on. The narrative of how those final decisions were arrived at is not essential unless the source skill specifically required it.
   - Every cross-reference (Task N, line N, file paths), count or list (test totals, the number of places something is connected, file lists), Acceptance Criterion bullet, and Validation Command: these are the details the finished work is checked against, so preserve them at full precision.

5. **Trim, don't refactor.**
   - Use the `Edit` tool to remove padding in place.
   - Do not reorder sections.
   - Do not rewrite sentences for style.
   - Do not merge or split sections.
   - Do not introduce new phrasing where surgical deletion works.

6. **Audit the trim section by section against the pre-trim version.**
   - Record the post-trim word count for each section and the file total.
   - For each section, verify: (a) all technical content preserved, (b) all nuance and caveats preserved, (c) all examples at full illustrative value, (d) all decision records preserved and every detail the work is checked against kept at full precision.
   - If any element is missing, restore it via `Edit` and re-audit that section.

7. **Verify targets and thresholds.**
   - Overall reduction must exceed 20%. If short and no additional safe cuts remain, report the shortfall with the reason.
   - For every section that survived without a ≥10% cut, name what held it: the specific requirement, check, or detail that made further cuts unsafe. A section without that line is not done; go back and cut it.
   - For any section containing content the source skill did not require, either trim it or justify (against the source skill's rules) why it must stay. Flagging excess without acting on it is not an outcome.

8. **Prepare the report for the User.**
   - Use the Human-Readable Report format below.

**Decision discipline**

- If a candidate cut removes meaning, or even might, leave it.
- If two sections duplicate content and neither is more authoritative than the other, ask the User which to preserve.
- Do not silently accept a section that goes beyond the source skill's rules; act (trim or justify).

**Quality/Safety constraints**

- Do not modify files other than `$ARGUMENTS`.
- Do not reorder sections, rename headings, or restructure the plan.
- Do not report a section as trimmed if an essential element was removed and not restored.
- Do not report success if overall reduction is <20% and untried safe cuts remain.

## Output (OUTPUT)

### Human-Readable Report

Return a concise, easy-to-scan summary in plain language at a 16-year-old reading level:

- **Status**: `Success` | `Partial (target unmet, no unsafe cuts remain)` | `Blocked`
- **Plan file**: `<path>`
- **Overall reduction**: `<pre-total> → <post-total>` (`<%>` reduction; target >20%)
- **Section audit**: one row per section, in plan order:
  - `<section heading>`: `<pre> → <post>` (`<%>` cut). Preservation of (a) technical / (b) nuance / (c) examples / (d) decision + check precision: `Preserved` or a named restoration note
  - For any section with <10% cut, one line naming what held it (specific requirement, check, or detail).
- **Sections trimmed substantively (≥10% cut)**: for each, name what prose was removed so the User can verify nothing essential was dropped.
- **Sections going beyond the source skill's rules**: for each, the trim applied or the justification against those rules, or `none`.
- **Restorations made during audit**: bullet list of elements restored after the initial trim, or `none`.
- **Questions (only if blocked)**: numbered list.

## Notes

- Run as the final step of the round of work that writes a plan, after drafting is complete and internally consistent.
- Trimming is not refactoring; if the plan needs restructuring, this command is not the right tool.
