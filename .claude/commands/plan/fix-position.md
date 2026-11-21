---
description: Save the previous AI response verbatim to a markdown file, writing to `docs/options/<slug>-problem-definition.md` using a supplied or inferred kebab-case slug, then have the document-reviewer sub-agent read the saved file and correct its wording.
argument-hint: [slug] (optional - kebab-case slug for the feature/bug; inferred from the previous response if omitted)
allowed-tools: Read, Write, Edit, Agent, Bash(mkdir:*), Bash(test:*), AskUserQuestion
---

# /fix-position: Save The Problem Definition

## Philosophy (Why this exists)

This command anchors a planning cycle by capturing the problem definition as a standalone artifact so that downstream chain commands can derive every subsequent artifact's location and name from this single anchor. Fidelity comes first: the file is saved as the previous AI response exactly as it appeared to the user, so that nothing from an earlier response in the conversation finds its way in. Fidelity only serves the chain when the response is a complete definition, so the sections downstream commands read are confirmed present before anything is written. Readability comes second: once the saved file matches the response, the `document-reviewer` sub-agent reads it as someone who has not seen the conversation, and its findings correct the wording while the content stays what the response said. The filename is derived from the slug, and the filename becomes the canonical source of truth for the rest of the chain.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/fix-position` (infer the slug from the previous response)
- `/fix-position auth-redesign`
- `/fix-position "Auth Redesign"` (will be normalised to `auth-redesign`)

**Arguments received**

- Positional: `$1`

**Arguments policy**

- **Mandatory**: None. The slug is optional.

**Argument contract**

- Required args: None.
- Optional args: `$1` = slug for the feature/bug (e.g. `auth-redesign`). May be supplied in any case or separator style; it will be normalised to kebab-case in Step 3.
- Defaults: If `$1` is omitted, infer the slug from the source response using the rules in Step 3.
- Validation rules:
  - `$1`, if provided, must not contain `/` or `\` (it is a slug, not a path).
  - The slug after normalisation must be non-empty.

**If arguments are missing/invalid**

- If `$1` contains a path separator, stop and ask the user to re-run with a bare slug.
- If any extra positional argument beyond `$1` is present, stop and ask the user to re-run with only `[slug]`, quoting the slug if it contains spaces.
- If a non-empty slug cannot be produced from either `$1` or the source response, stop and ask the user to supply one.

## Process (PROCESS)

Follow these steps in order:

1. **Identify the source response.**
   - Treat the previous AI response immediately before this command invocation as the source response.
   - Use only the response text that was visible to the user.
   - Do not include hidden reasoning, tool calls, tool output, or this command's own response.
   - If the previous AI response is not available verbatim in the conversation, stop and ask the user to paste the response to be saved.
   - Confirm the source response contains every section the chain reads later: `Problem`, `In scope`, `Out of scope`, `Settled decisions and constraints`, `Reference files`, `Done means`, and `Open decisions`.
   - If any of those sections is missing, stop and ask the user to re-issue the definition in full. Do not save a partial one.

2. **Validate the invocation arguments.**
   - If `$1` is provided, confirm it does not contain `/` or `\`. If it does, stop and ask for a bare slug.
   - If any extra positional argument beyond `$1` is present, stop and ask the user to re-run the command with only `[slug]`, quoting the slug if it contains spaces.

3. **Determine the slug.**
   - If `$1` is provided, use that value as the slug source.
   - If `$1` is not provided, inspect the source response for an explicit name, preferring in this order:
     - a top-level markdown heading
     - an explicit `Name:` or `Title:` field
     - a named artifact, recommendation, plan, command, feature, or document that the response clearly centres on
   - If no explicit name exists in the source response, create a concise descriptive slug from the source response's central topic.
   - When creating a descriptive slug yourself, attempt to use exactly three words. Use more than three words only if three words would be unclear.
   - Convert the slug source to kebab-case:
     - lowercase all letters
     - replace spaces, underscores, hyphens, punctuation, and other non-alphanumeric separators with single hyphens
     - collapse repeated hyphens
     - trim leading and trailing hyphens
   - If normalisation produces an empty slug, stop and ask the user to supply one.

4. **Prepare the target folder and file path.**
   - The target folder is `docs/options/`.
   - Compute the target file: `docs/options/<slug>-problem-definition.md`.
   - Use `test -e <target-folder>` to check whether the target folder exists.
   - If the target folder does not exist, create it with `mkdir -p`.
   - Use `test -e <target-file>` to check whether the target file exists.
   - If the target file already exists, stop and ask before overwriting it.

5. **Write the markdown file.**
   - Write exactly the source response from Step 1 to the target file.
   - Do not add YAML frontmatter, headings, timestamps, source notes, explanations, wrappers, or any other metadata.
   - Preserve every visible character from the source response, including spelling, punctuation, capitalisation, markdown syntax, code fences, links, bullets, indentation, blank lines, and ordering.
   - Do not summarise, clean up, translate, escape, redact, reflow, or reformat the source response.

6. **Verify the saved content.**
   - Read the saved file back.
   - Compare the saved file against the source response character-for-character.
   - If any mismatch exists, rewrite the file once using the same exact source response and read it back again.
   - Do not report success unless the readback content exactly matches the source response.

7. **Run the document review.**
   - Start the `document-reviewer` sub-agent once, using the agent spawning tool with `subagent_type|agent_type: "document-reviewer"`, and pass it two paths and nothing else: the communication standard at `.agents/reference/communication-standard.md` and the file verified in Step 6.
   - Follow the instruction that closes its response, using Edit on the saved file only.
   - Correct wording only. Do not add, remove or change a decision, a constraint, a scope item, a reference file or a completion condition, and ignore any finding against a section name listed in Step 1.
   - Take the words for a correction from the source response. Where a correction would need content from anywhere else in the conversation, leave the finding.
   - If the sub-agent cannot be started, or reports that it is blocked, leave the file as verified in Step 6 and say so in the report.

8. **Prepare the report.**
   - Use the Human-Readable Report format below.

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.
- If the slug must be inferred, prefer the clearest stable name over a clever or overly specific one.

**Quality/Safety constraints**

- Until the readback in Step 6 passes, the markdown file must contain the previous AI response verbatim and nothing else.
- After the readback passes, change the file only through the document review in Step 7.
- Do not save a response that lacks any section named in Step 1.
- Do not overwrite an existing file without explicit user confirmation.
- Do not save the file outside `docs/options/`.
- Do not use a timestamp, random suffix, or generated ID in the slug unless the user explicitly provided one.
- Do not claim success unless the saved file passes exact readback verification.
- Do not include the saved response body in the command output.

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return a concise, easy-to-scan summary:

- **Status**: `Success` | `Blocked`
- **Slug**: the normalised kebab-case slug that was used.
- **Artifact**: `<actual target file path>`
- **Validation**: `Readback matched the previous AI response character-for-character.`
- **Document review**: what the document-reviewer's closing instruction says to tell the user, or that the review did not run.
- **Questions (omit if success)**:
  - Ask only for a valid slug, overwrite permission, a re-issued definition when a section is missing, or the response text if it was not available verbatim.

## Notes

- This command is the anchor step of the planning chain. The filename it writes is the single source of truth for the slug; downstream chain commands write next to the problem definition, in `dirname(<problem-definition-path>)`, and take the slug from its filename by removing the `-problem-definition.md` ending.
- This command saves the last AI response and nothing from earlier in the conversation; it is not a summariser and does not extract lessons.
- The `document-reviewer` sub-agent must be present in `.claude/agents/`, or the document review in Step 7 cannot run.
