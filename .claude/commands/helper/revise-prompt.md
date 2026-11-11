---
description: Revise the user's original prompt into a self-contained, improved version based on feedback, using surgical edits that preserve voice, structure, and intent while fixing the gaps identified.
argument-hint: <feedback> (required - what was missing, wrong, unclear, or underspecified in the previous AI response)
allowed-tools:
---

# /revise-prompt: Revise a Prompt Based on Feedback

## Philosophy (Why this exists)

A weak answer often comes from a weak prompt, not a weak model. This command repairs the prompt itself — surgically editing the original so that a brand-new agent with no conversation history could produce a better response. The output is the prompt, not advice about the prompt.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/revise-prompt You didn't explain the reasoning behind the trade-offs, and you skipped the constraint about keeping it under 200 words.`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Required**: Arguments must be supplied. The argument carries the feedback about the AI response being critiqued.

**Argument contract**

- Required args: `$ARGUMENTS` = the user's feedback on what was missing, wrong, unclear, or underspecified in the AI response they're critiquing
- Optional args: None
- Defaults (if any): None
- Validation rules: `$ARGUMENTS` must be non-empty free-form text

**If arguments are missing/invalid**

- If `$ARGUMENTS` is empty, stop and ask the user to state what was missing, wrong, unclear, or underspecified in the AI response.

## Context to Load (INPUT)

**Read these from the current conversation (no tools needed)**

- The user's original prompt — the most recent user prompt in the conversation before this command was invoked, which produced the AI response being critiqued.
- The AI's last response — the response to that most recent user prompt, which the user is giving feedback on.
- The user's feedback — from `$ARGUMENTS`.

## Process (PROCESS)

Follow these steps in order:

1. **Locate the three inputs.**
   - Original prompt: the most recent user prompt in the conversation before this command was invoked — the prompt whose AI response is being critiqued.
   - AI's last response: the response to that most recent user prompt.
   - Feedback: `$ARGUMENTS`.
2. **Diagnose the gap.**
   - State (internally) what the feedback says was missing, wrong, unclear, or underspecified.
   - Map each point in the feedback to concrete additions/edits the prompt needs: context, constraints, definitions, scope boundaries, output instructions, or evaluation criteria.
3. **Plan surgical edits.**
   - Identify the specific sentences, clauses, or sections of the original prompt that must change.
   - Do not add new sections if the existing structure can absorb the missing content.
   - Do not append "bolt-on" clauses to the end of existing sentences — integrate edits so they read as original.
4. **Preserve style invariants.**
   - Match the original prompt's voice, rhythm, tone, verbosity, and grammar.
   - Preserve its structure, layout, section ordering, and flow.
   - Keep the user's original goal and intent unchanged.
5. **Make the prompt self-contained.**
   - The revised prompt must stand alone for a brand-new agent with no access to the prior conversation, the AI's earlier response, or the user's feedback.
   - Inline any context the new agent would otherwise be missing.
6. **Produce the output using the OUTPUT section below.**

**Decision discipline**

- Prefer the lightest edit that fixes the gap. Resist rewriting sentences that already work.
- If the feedback implies multiple interpretations, pick the one most consistent with the original goal and proceed; do not ask unless genuinely blocked.

**Quality/Safety constraints**

- Do not answer the original question.
- Do not explain your reasoning, add commentary, notes, alternatives, or meta-preamble.
- Do not wrap the revised prompt in quotes, code fences, or decorative framing unless the original prompt used them.
- Do not introduce new section headings, numbered lists, or structural elements that were not in the original.

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return **only** the revised prompt. Nothing else. No status line, no "Here is the revised prompt:" preamble, no trailing notes, no explanation of what you changed. The user will paste the output directly into a new chat with a new agent, so every extra word is noise.

## Notes

- The whole value proposition collapses if the output contains anything other than the revised prompt. When in doubt, strip.
- If the original prompt was markdown-formatted, preserve the markdown exactly. If it was plain text, keep it plain.
