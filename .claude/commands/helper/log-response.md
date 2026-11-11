---
description: Append a concise log entry for the previous AI response to `.agents/reports/response-log.md` with required metadata fields.
argument-hint: (This command must be invoked with no arguments)
allowed-tools: Read, Edit, Write, Bash(date:*), Bash(mkdir:*), Bash(test:*), AskUserQuestion
---

# /log-response: Log The Previous AI Response

## Philosophy (Why this exists)

This command preserves a concise, searchable record of the previous AI response for future sessions.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/log-response`

**Arguments received**

- None

**Arguments policy**

- **None**: This command must be invoked with no arguments. If provided, stop and ask to re-run without args.

**Argument contract**

- Required args: None
- Optional args: None
- Defaults: None
- Validation rules: No arguments are accepted.

**If arguments are missing/invalid**

- If any arguments are provided, stop and ask the user to re-run `/log-response` with no arguments.

## Process (PROCESS)

Follow these steps in order:

1. **Validate the invocation.**
   - If the command was invoked with any arguments, stop and ask the user to re-run `/log-response` with no arguments.

2. **Identify the source response.**
   - Treat the previous AI response immediately before this command invocation as the source response.
   - Use only the response text that was visible to the user.
   - Do not include hidden reasoning, tool calls, tool output, or this command's own response.
   - If the previous AI response is not available verbatim in the conversation, stop and ask the user to paste the response to be logged.

3. **Prepare the fixed log file.**
   - Use exactly `.agents/reports/response-log.md` as the target file.
   - Run `mkdir -p .agents/reports`.
   - Use `test -e .agents/reports/response-log.md` to check whether the target file exists.
   - If the target file does not exist, create it.
   - Do not overwrite or truncate the target file.

4. **Capture the log metadata.**
   - Capture `datetime` by running `date '+%Y-%m-%d %H:%M:%S %Z'`.
   - Capture `agent` using this exact instruction:
     - Give me a one-word answer: your name.
   - Create `breadcrumbs` using these instructions:
     - Include single word or two word phrases that someone might vaguely remember later.
     - Prefer stable, searchable signposts over narrative explanation.
     - Mix:
       - Domain/feature names (e.g. auth, onboarding, billing)
       - Technologies/tools (e.g. JWT, Redis, Terraform)
       - Plain-language synonyms (e.g. login flow, rate limiting, CSV export)
     - Keep it small: 3-8 items, comma-separated.

5. **Prepare the log entry.**
   - Add an H2 heading with an appropriate title for the source response.
   - Under the heading, add these fields in exactly this order:
     - `datetime`
     - `agent`
     - `breadcrumbs`
     - `response`
   - Use this markdown structure:

```markdown
## <response title>

**datetime:** <YYYY-MM-DD HH:MM:SS TZ>
**agent:** <agent>
**breadcrumbs:** <breadcrumbs>
**response:**

<rewritten response>
```

- Rewrite the source response for brevity before placing it under `response`.
- Remove unnecessary words, repetition, filler, and over-explanation.
- Do not remove substantive content or reasoning.
- Preserve code, commands, paths, filenames, and exact quoted text when changing them would alter the meaning.

6. **Append the log entry.**
   - Add the prepared log entry to the end of `.agents/reports/response-log.md`.
   - If the target file already contains content, separate the new log entry from the previous content with one blank line.

7. **Verify the append.**
   - Read `.agents/reports/response-log.md` back.
   - Confirm the new log entry appears at the end of the file.
   - Confirm the new log entry contains exactly one H2 heading and the fields `datetime`, `agent`, `breadcrumbs`, and `response` in that order.
   - Confirm the `response` field is not empty.
   - Do not report success unless the append verification passes.

8. **Prepare the report.**
   - Use the Human-Readable Report format below.

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.
- Prefer a clear, stable heading and breadcrumbs over clever or overly specific wording.

**Quality/Safety constraints**

- Do not accept arguments.
- Do not write to any response log path other than `.agents/reports/response-log.md`.
- Do not overwrite or truncate existing log content.
- Do not include hidden reasoning, tool calls, or tool output in the logged response.
- Do not include the logged response body in the command output.
- The rewritten response should communicate the same content with fewer words, not less meaning.
- Do not claim success unless the new entry is verified at the end of the target file.

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return a concise, easy-to-scan summary:

- **Status**: `Success` | `Blocked`
- **Artifact**: `.agents/reports/response-log.md`
- **Heading**: `<response title>`
- **Breadcrumbs**: `<breadcrumbs>`
- **Questions (omit if success)**:
  - Ask only for a no-argument re-run or the response text if it was not available verbatim.
