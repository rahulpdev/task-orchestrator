---
description: Apply the edits agreed in the current conversation to a target document so the result reads as if the original author drafted it. No added bloat, no in-file rationale, no over-fitting to the triggering incident, and no sentence the reader has to reread.
argument-hint: [free-form string] (optional - may include a target file path and/or extra scoping notes; if omitted, uses the file and edit set already established in the conversation)
allowed-tools: Read, Edit, Write, Grep
---

# /seamless-edit: Surgical, Voice-Preserving Document Edit

## Philosophy

An edit is not an appendix. Once applied, the passage must read as if the original writer drafted it that way on the first pass. The reader should not be able to find the seam. This forces four disciplines that AI editors routinely break:

1. **Rewrite, do not accrete.** When new meaning is needed, rework the sentence or paragraph so the voice and structure absorb it. Do not bolt a qualifier, a parenthesis or a trailing clause onto an existing sentence to fit the new point in.
2. **Leave no trace of the edit in the file.** The document serves its future reader, not the record of how it changed. No "updated to clarify", no "added because", no "note: this now covers". Nothing that reveals a revision happened.
3. **Write to the principle, not the incident.** The issue that triggered the edit is one symptom. The file must govern every future case of the same kind, including cases that look nothing like the trigger. Any example must show the principle in general, not record the case at hand.
4. **Hold new sentences to the communication standard.** Be strictest where the edit is an Insert with little surrounding prose to match.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/seamless-edit`
- `/seamless-edit path/to/document.md`
- `/seamless-edit path/to/document.md — also tighten the intro paragraph while you're in there`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Optional**: `$ARGUMENTS` may be omitted. When provided, it is a free-form string that may contain a target file path, additional editing instructions, or both.

**Argument contract**

- Required args: None
- Optional args: `$ARGUMENTS` = free-form string. Common uses: a file path to the document being edited, extra scoping notes, or a clarification of which agreed edits to apply first.
- Defaults: If `$ARGUMENTS` is empty, use the file already under discussion in the current conversation and the full agreed edit set.
- Validation rules: If `$ARGUMENTS` contains a token that looks like a file path, that path must resolve to an existing readable file.

**If arguments are missing/invalid**

- If no file is identified from `$ARGUMENTS` or the conversation, stop and ask: "Which file should I apply the agreed edits to?"
- If a path parsed from `$ARGUMENTS` does not exist, stop and ask; do not create a new file.

## Context to Load (INPUT)

**Read these files (auto-load into context)**

- The target document identified above, **in full**. Do not operate on excerpts.
- `.agents/reference/communication-standard.md`, **in full**. If this file is not found, stop and ask for it.

## Process (PROCESS)

Follow these steps in order:

1. **Restate the agreed edit set before touching the file.**
   - List every edit the conversation has agreed on, in your own words.
   - For each edit, name the target section or passage in the document.
   - If any item on this list is ambiguous, stop and ask before proceeding. Do not guess at intent.

2. **Abstract each edit from incident to principle.**
   - For every edit, write down (internally, not in the file):
     - The specific issue that triggered it.
     - The underlying class of issue it belongs to.
     - The principle the document must express so it handles the whole class, including future instances that will not resemble the trigger.
   - The edit you actually apply must be written at the level of that principle. If you find yourself referencing the triggering example verbatim, that is a signal you have not yet abstracted far enough.

3. **For each edit, choose the integration mode before writing.**
   - **Rewrite** the sentence or paragraph when the new meaning changes what the passage is about, when appending would produce a run-on, or when the surrounding rhythm would suffer.
   - **Insert** a new sentence or short passage when the point is genuinely new and does not belong inside an existing sentence.
   - **Never append** a qualifier, clause or parenthesis to an existing sentence just to fit the new meaning in. If your instinct is to attach ", noting that" or ", and also" to a sentence, reject it and rewrite the sentence instead.

4. **Match the original voice, and hold the communication standard.**
   - Before writing, scan the passage the edit will sit next to for cadence, formality, heading style, example style and terminology, and match them.
   - Where the document's own style conflicts with the communication standard, follow the document. In everything else, the new sentences follow the communication standard.
   - Write the edit so an independent reader cannot distinguish it from its neighbours.

5. **Apply each edit surgically to the file.**
   - Use `Edit` for targeted replacements; use `Write` only if a full rewrite is genuinely required.
   - Change only what the edit requires. Do not restyle unrelated passages, "improve" nearby prose, or refactor structure that was not part of the agreed edit set.
   - Do not insert any of the following into the file, in any form:
     - Rationale for the edit ("This section was updated because…", "Added to address…", "Note: previously this said…").
     - Change markers, edit timestamps, revision notes, or author annotations.
     - HTML comments, code comments, or footnotes that exist only to explain the edit to a future reader.
     - References to the triggering incident, the conversation that produced the edit, or the fact that the passage was revised.
   - If a comment or note is genuinely part of the content the reader needs (e.g., a legitimate footnote in a document that already uses footnotes), it must be written as if it had always been there.
   - Assert nothing new. Every factual claim in the new text must come from the agreed edit set or from elsewhere in the document. A claim neither supports is removed, or marked the way the document marks a proposal.

6. **Seam test and newcomer test: read the edited passages in context.**
   - For each edit, re-read the passage plus the paragraph before and after it as a single block.
   - Ask: could a first-time reader identify where the edit begins and ends? If yes, the seam is visible. Rework the passage until it disappears. Common tells are a sudden shift in sentence length, a change in terminology, an example no other paragraph uses, or a shift in tone.
   - Then read the same block as someone new to the subject. Rewrite any sentence that needs rereading, carries more than one idea, or makes the reader infer a missing step.

7. **Principle test: read each edit against a hypothetical future case.**
   - For each edit, imagine a future instance of the same underlying class that looks nothing like the triggering issue.
   - Ask: does the edited passage, as written, correctly govern that future case? If it only governs the specific trigger, the edit is over-fitted. Generalise the language. If examples are used, replace or broaden them so they illustrate the principle rather than the incident.

8. **Congruity sweep.**
   - Re-read the full document once more. Confirm that terminology, cross-references, ordering, and any rules stated elsewhere in the file remain consistent with the newly edited passages. Resolve any incongruities the edits introduced, at minimum-change discipline.

9. **Handoff: produce the final response using the OUTPUT section below.**

**Decision discipline**

- If the agreed edit set is ambiguous, stop and ask. Do not synthesise edits that were not explicitly agreed.
- If an edit cannot be applied without violating one of the four disciplines (no accretion, no in-file rationale, no over-fitting, the communication standard), stop and propose a reformulation before writing.

**Quality/Safety constraints**

- Edit only the target document. Do not touch unrelated files.
- Do not add commentary, changelogs, or metadata inside the file.
- Do not expand scope beyond the agreed edit set.
- Do not create new files unless the agreed edits explicitly require it.

## Output (OUTPUT)

### Human-Readable Report

Return a concise summary in plain language:

- **Status**: Success | Partial | Blocked
- **Target file**: path to the edited document
- **Edits applied**: numbered list, one line per edit. Name the section or passage and state, in one sentence, what the edit accomplished at the principle level, not the incident level
- **Integration mode used** for each edit: Rewrite | Insert (should almost never be "Append")
- **Seam test result**: confirm each edited passage reads seamlessly with its surroundings, or flag any passage where the seam could not be fully hidden and why
- **Principle test result**: confirm each edit governs the underlying class, or flag any edit that remains tied to the triggering example and why
- **Incongruities resolved**: any consistency issues the edits introduced elsewhere in the file, and how they were reconciled
- **Not done**: anything the user might have expected but that was outside the agreed edit set, listed so the user can confirm the scope was correct
- **Questions (only if blocked)**: numbered list

## Notes

- This command assumes the edit set has already been agreed in conversation. It is not a drafting or brainstorming command. If the edits are still under discussion, resolve that first and then invoke this command.
