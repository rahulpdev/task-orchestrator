---
description: Append a concise log entry for the previous AI response to `docs/backlog/response-log.md` with required metadata fields, then have the document-reviewer sub-agent read the log and correct the new entry's wording.
argument-hint: (This command must be invoked with no arguments)
allowed-tools: Read, Edit, Write, Agent, Bash(date:*), Bash(mkdir:*), Bash(test:*), AskUserQuestion
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
   - Use exactly `docs/backlog/response-log.md` as the target file.
   - Run `mkdir -p docs/backlog`.
   - Use `test -e docs/backlog/response-log.md` to check whether the target file exists.
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
   - Use the entry layout in the Saved File section.
   - Rewrite the source response for brevity before placing it under `response`.
   - Remove unnecessary words, repetition, filler, and over-explanation.
   - Do not remove substantive content or reasoning.
   - Preserve code, commands, paths, filenames, and exact quoted text when changing them would alter the meaning.

6. **Append the log entry.**
   - Add the prepared log entry to the file as the Saved File section describes.

7. **Verify the append.**
   - Read `docs/backlog/response-log.md` back.
   - Confirm the new log entry appears at the end of the file.
   - Confirm the new log entry contains exactly one H2 heading and the fields `datetime`, `agent`, `breadcrumbs`, and `response` in that order.
   - Confirm the `response` field is not empty.
   - Do not report success unless the append verification passes.

8. **Run the document review.**
   - Start the `document-reviewer` sub-agent once, using the agent spawning tool with `subagent_type|agent_type: "document-reviewer"`, and pass it two paths and nothing else: the communication standard at `.agents/reference/communication-standard.md` and `docs/backlog/response-log.md`.
   - Follow the instruction that closes its response, using Edit on the entry verified in Step 7 only.
   - Correct wording only. Do not remove substantive content or reasoning, and ignore any finding outside that entry or against a field name the Saved File section fixes.
   - If the sub-agent cannot be started, or reports that it is blocked, leave the entry as verified in Step 7 and say so in the report.

9. **Prepare the report.**
   - Use the Human-Readable Report in the Output section.

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.
- Prefer a clear, stable heading and breadcrumbs over clever or overly specific wording.

**Quality/Safety constraints**

- Do not accept arguments.
- Do not write to any response log path other than `docs/backlog/response-log.md`.
- Do not overwrite or truncate existing log content.
- Do not change any entry other than the one this run adds.
- Do not include hidden reasoning, tool calls, or tool output in the logged response.
- Do not include the logged response body in the command output.
- The rewritten response should communicate the same content with fewer words, not less meaning.
- Do not claim success unless the new entry is verified at the end of the target file.

## Saved File (OUTPUT)

- **Path**: `docs/backlog/response-log.md`
- **Naming rule**: The name is fixed.
- **Written for**: a human.
- **If the file already exists**: Add the new entry to the end. If the file already contains content, separate the new entry from it with one blank line.

**Layout**

Each run adds one entry in this structure:

```markdown
## <response title>

**datetime:** <YYYY-MM-DD HH:MM:SS TZ>
**agent:** <agent>
**breadcrumbs:** <breadcrumbs>
**response:**

<rewritten response>
```

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return a concise, easy-to-scan summary. Beyond the items below, repeat nothing that is in the file:

- **Status**: `Success`, or `Blocked` with the reason, including when the file could not be written.
- **File**: `docs/backlog/response-log.md`
- **Heading**: `<response title>`, which says which entry was added
- **Document review**: what the document-reviewer's closing instruction says to tell the user, or that the review did not run.
- **Questions (omit if success)**:
  - Ask only for a no-argument re-run or the response text if it was not available verbatim.

## Notes

- The `document-reviewer` sub-agent must be present in `.claude/agents/`, or the document review in Step 8 cannot run.
