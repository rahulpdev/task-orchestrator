---
name: check-ignore-comments
description: Find every noqa and type-ignore comment in the codebase, investigate why each exists, and write a report with resolution options and a recommendation for each.
allowed-tools: Read, Glob, Grep, Bash(mkdir:*), Bash(date:*), Write, Edit, Agent
context: fork
agent: general-purpose
---

Find all noqa/type:ignore comments in the codebase, investigate why they exist, and provide recommendations for resolution or justification.

Create a markdown report file (create the reports directory if not created yet): `.agents/reports/ignore-comments-report-{YYYY-MM-DD}.md`

For each ignore comment found, include in the report:

---

**File:** `path/to/file.py:line_number`

**Code:**
```python
{the line with the ignore comment}
```

**Why it exists:**
{explanation of why the suppression was added}

**Options to resolve:**

1. {Option 1: description}
   - Effort: {Low/Medium/High}
   - Breaking: {Yes/No}
   - Impact: {description}

2. {Option 2: description}
   - Effort: {Low/Medium/High}
   - Breaking: {Yes/No}
   - Impact: {description}

**Tradeoffs:**

- {Tradeoff 1}
- {Tradeoff 2}

**Recommendation:** {Remove | Keep | Refactor}
{Justification for recommendation}

---

{Repeat for each comment}

Once the report is written, start the `document-reviewer` sub-agent once and pass it two paths and nothing else: the communication standard at `.agents/reference/communication-standard.md` and the report. Follow the instruction that closes its response. Correct wording only: do not change a recommendation, and ignore any finding against a field label the format above fixes.
