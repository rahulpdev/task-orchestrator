---
description: Review a recently edited file for contradictions, inconsistencies, and discrepancies, then fix them
argument-hint: [file-path] (optional - the file that was recently edited; defaults to plan.md in the Archon artifacts directory)
allowed-tools: Read, Edit, Glob, Grep, Bash(printenv ARTIFACTS_DIR)
---

# Check Congruity: Post-Edit Integrity Review

## Philosophy

**Internal consistency is a prerequisite for a file to function as intended**. Whether the file is documentation, a configuration, a prompt, or a specification, its consumers (human or agent) will interpret it as a single coherent source of truth. A contradiction within that source degrades trust and causes downstream errors.

The goal is not just correctness — it is **congruity**: every part of the file agreeing with every other part, while preserving the intent behind the edits that triggered this review.

## File to Review

**Target file**: $ARGUMENTS

If no path was given above, run `printenv ARTIFACTS_DIR`. If it prints a non-empty directory, the **Target file** is `plan.md` inside it (Archon workflow context); otherwise stop and ask for the file path. A path given as an argument always takes precedence.

This file has been recently edited. The edits were made for a reason. Your job is to ensure those edits did not inadvertently break the file's internal consistency — not to second-guess the edits themselves.

## Congruity Review Process

### 1. Read the File in Full

Read the entire file from beginning to end. Do not skim. Do not skip sections.

Build a mental model of:

- The file's overall purpose and audience
- Its organizational structure and flow
- Key terms, concepts, and definitions used
- Any rules, principles, or constraints stated
- Sequences, orderings, or dependencies described
- Cross-references between sections (explicit or implied)

### 2. Analyze for Incongruities

Systematically examine the file for the following categories of incongruity:

**Contradictions** — Two statements that cannot both be true:

- A principle stated in one section that is violated or reversed in another
- Conflicting instructions (e.g., "always do X" in one place, "never do X" in another)
- Incompatible values, settings, or parameters

**Inconsistencies** — Statements that do not directly conflict but fail to align:

- Terminology drift (same concept referred to by different names without explanation)
- Numbering or ordering mismatches (e.g., "Step 3" references something from "Step 5")
- Tone or voice shifts that suggest spliced content from different sources
- Format inconsistencies within like-elements (e.g., some list items are sentences, others are fragments)

**Discrepancies** — Gaps between what is stated and what is implied or expected:

- A section header that promises content the section does not deliver
- A reference to an item, file, or concept that is not defined or introduced elsewhere in the file
- An example that does not match the rule or pattern it is supposed to illustrate
- Missing context that was likely present before the edit but was inadvertently removed

**Structural issues** — Problems with the file's organization that affect coherence:

- Orphaned sections that no longer connect to surrounding content
- Redundant passages that say the same thing in conflicting ways
- Broken logical flow where the edit disrupted the original narrative progression

### 3. Itemize Findings

Compile a checklist of every incongruity found. For each item, record:

- **Location**: Section or line reference where the incongruity appears
- **Category**: Contradiction / Inconsistency / Discrepancy / Structural
- **Description**: What the incongruity is, stated concisely
- **Proposed fix**: How to resolve it while preserving the file's meaning and the edit's intent

If no incongruities are found, state this explicitly and skip to Step 6.

### 4. Fix Each Incongruity

Work through the checklist **one item at a time**, in order. For each fix:

1. Apply the proposed fix
2. Verify the fix resolves the stated incongruity
3. Check that the fix has not altered the meaning or functioning of the surrounding content
4. Mark the item as complete

**Guiding constraint**: Every fix must be the **minimum change** that resolves the incongruity. Do not refactor, rephrase for style, or "improve" content beyond what is required for internal consistency. The file's voice and structure belong to its author — you are a proofreader for coherence, not an editor for quality.

### 5. Re-Review the File

After all fixes are applied, read the entire file again from beginning to end. This second pass has a single purpose: verify that your fixes did not introduce **new** contradictions, inconsistencies, or discrepancies.

If new incongruities are found:

- Add them to the checklist
- Fix them following the same discipline as Step 4
- Re-review again until the file is clean

### 6. Verify Success Criteria

Confirm that all three criteria are met before reporting:

1. **Completeness**: The checklist of incongruities is fully resolved — every item is checked off.
2. **Preservation**: The fixes have not materially altered the meaning or functioning of the file contents.
3. **Intent retention**: The intent behind the initial file edits has been maintained. The edits were made for a reason, and that reason is still served.

If any criterion is not met, revisit the relevant fixes before proceeding to the report.

## Output Report

### Congruity Review: `<target file path>`

**Status**: [Clean — no incongruities found | Resolved — N incongruities found and fixed | Partial — N incongruities found, M unresolved]

**File Purpose** (as understood): [1-2 sentence summary of the file's role]

---

#### Findings

If incongruities were found:

| #   | Category | Location       | Description      | Fix Applied        | Status  |
| --- | -------- | -------------- | ---------------- | ------------------ | ------- |
| 1   | [type]   | [section/line] | [what was wrong] | [what was changed] | ✅ / ⚠️ |

If no incongruities were found:

> The file is internally consistent. No contradictions, inconsistencies, or discrepancies were detected.

---

#### Success Criteria Verification

- [ ] **Completeness**: All identified incongruities resolved
- [ ] **Preservation**: File meaning and function unchanged by fixes
- [ ] **Intent retention**: Original edit intent preserved

---

#### Observations

- [Any observations about the file's structure, areas of particular density or risk, or suggestions for the author — only if genuinely useful]
- [If the review required multiple re-review passes, note what the secondary fixes addressed]

## Notes

- This command reviews a **single file** in isolation. It does not check congruity across multiple files.
- If the file is too large to read in a single pass, read it in sections but ensure every section is reviewed against every other section for cross-references.
- If the file contains code, check that comments and docstrings are congruent with the code they describe.
- If you are uncertain whether something is an incongruity or an intentional choice by the author, err on the side of flagging it in the report with a note rather than silently changing it.
