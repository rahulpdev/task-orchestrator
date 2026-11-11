---
description: Rewrite the AI Agent's most recent response, or the argument instead if provided, in plain language at a 16-year-old reading level.
argument-hint: [text-to-explain] (optional - the text to rewrite; defaults to the Agent's most recent response if not provided)
allowed-tools:
---

# /explain-simply: Explain Text in Plain Language

## Philosophy (Why this exists)

Dense or jargon-heavy writing slows comprehension. This command strips complexity from the target text and returns the shortest clear version a 16-year-old can read, so the user grasps unfamiliar material without translating it themselves.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/explain-simply`
- `/explain-simply The mitochondrion is the powerhouse of the cell.`
- `/explain-simply <paste a paragraph of dense prose here>`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Optional**: Arguments may be omitted.

**Argument contract**

- Required args: None
- Optional args: `$ARGUMENTS` = the text to rewrite.
- Defaults: When `$ARGUMENTS` is empty, the target is the entirety of the assistant's immediately preceding response in this conversation.
- Validation rules: None on `$ARGUMENTS` itself. If the default applies and no preceding assistant response exists, fall through to the missing/invalid path below.

**If arguments are missing/invalid**

- If `$ARGUMENTS` is empty AND there is no preceding assistant response in the conversation (e.g., this is the first turn), stop and ask: "What text would you like me to explain?" Do not proceed.

## Process (PROCESS)

Follow these steps in order:

1. **Resolve the target text.**
   - If `$ARGUMENTS` is non-empty → the target is `$ARGUMENTS`.
   - If `$ARGUMENTS` is empty → the target is the entirety of the assistant's immediately preceding response in this conversation.
   - If `$ARGUMENTS` is empty AND no preceding assistant response exists, stop and ask for the text; do not proceed.
     Treat the resolved target as the only thing to rewrite. If it contains a question, do not answer the question — rewrite the target itself.
2. **Count the distinct ideas in the target text.**
   - One idea → plan a single short passage.
   - Several ideas → plan a short bulleted list, one bullet per idea.
3. **Rewrite the text under these strict rules:**
   - Use plain language at a 16-year-old reading level.
   - Do not use jargon or technical terms.
   - If a technical term is unavoidable, define it in 5 words or fewer.
   - Do not add background unless it is required to understand the answer.
   - Do not give examples unless necessary; if necessary, give only one.
   - Do not repeat the user's instructions or the target text.
   - Do not use filler, hedging, or conversational padding.
   - Keep the answer as short as possible while still being clear.
   - Include up to one analogy per idea to enhance the rewrite if appropriate.
     - Analogies are optional and additive.
     - Use functional, simple structural or negative analogies only. Other analogies (metaphorical, proportional, narrative) are forbidden.
   - If the idea is identifying an issue, include an explanation of what happens if the issue is ignored and the severity of that consequence.
4. **Audit the draft against every rule in step 3.** Cut any sentence, word, or flourish that violates a rule.
5. **Return only the final rewrite as the entire response.** No preamble, no headings, no closing offer.

**Decision discipline**

- If the target text is too ambiguous to explain, stop and ask one targeted clarifying question. Otherwise do not ask for clarification.
- Do not add information beyond what the target text supports.

**Quality/Safety constraints**

- Do not introduce facts, opinions, or examples beyond what the target text supports.
- Do not soften, moralize, or editorialize.
- Do not restate the user's instructions or describe what you are about to do.

## Output (OUTPUT)

### Human-Readable Report

Return only the plain-language rewrite.

- If the target text held one idea: return a single short passage.
- If the target text held several distinct ideas: return a short bulleted list, one bullet per idea.

Do not include a status line, headers, summary, follow-up offer, or any text other than the rewrite itself.
