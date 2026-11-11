---
description: Answer the current technical question as a senior software engineer and architect would - reason from first principles, work within the architecture and decisions already in place, and report in plain language with no jargon, no metaphors, and no unexplained code references.
argument-hint: [question-or-context] (optional - the problem to solve; defaults to the current conversation topic)
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(ls:*), Bash(cat:*), Bash(find:*), WebFetch, WebSearch
---

# /think-architect: Solve It Like a Senior Architect, Explain It Plainly

## Philosophy (Why this exists)

Quick answers tend to bolt a fix onto the side of a system and describe it in language the project owner cannot check. This command forces two things at once: the solution must sit inside the architecture and the decisions already made (or change them on purpose, with a stated reason), and the explanation must be readable by someone who never reads code.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/think-architect`
- `/think-architect How should background jobs be retried when the queue is down?`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Optional**: `$ARGUMENTS` may be omitted. When omitted, the target is the technical question or problem under discussion in the current conversation.

**Argument contract**

- Required args: None
- Optional args: `$ARGUMENTS` = the question, problem, or extra constraints.
- Defaults: Empty string - target is taken from the current conversation.
- Validation rules: None.

**If arguments are missing/invalid**

- If `$ARGUMENTS` is empty AND the conversation contains no technical question or problem, stop and ask: "What problem would you like me to think through?" Do not proceed.

## Process (PROCESS)

Follow these steps in order:

1. **State the problem in one or two sentences.** Say what outcome counts as solved. If the problem is ambiguous in a way that changes the answer, stop and ask one targeted question.
2. **Find the architecture and decisions already in place.** Inspect the relevant code, configuration, and any design or planning documents in the repository. Note the patterns, boundaries, and constraints the project already commits to. If the repository gives no evidence on a point, say so rather than guessing.
3. **Reason from first principles.** Work out what the problem actually requires - inputs, outputs, failure modes, and constraints - before considering any specific solution.
4. **Build the solution inside the existing architecture.** Place it where the current design says it belongs. Do not route around an existing decision, boundary, or pattern because it is inconvenient.
5. **Decide whether the architecture itself needs to change.** If the correct answer requires a change, make it a deliberate one: state exactly what changes, why the current design cannot carry the solution, and what the change costs. If no change is needed, say that.
6. **Check the solution against common standards and best practice** for the language, framework, and problem type in play. Where the repository's own conventions differ from the wider standard, follow the repository and say why.
7. **Communicate with the User under these strict language rules:**
   - Plain language at a 16-year-old reading level.
   - Never invent or use a metaphor, a nickname, or jargon as the name for something. Say what the thing does instead.
   - Never mention a file, function, variable, setting, command, or any other code object without explaining in plain words what it is and what it does. Assume the user never reads code.
   - No filler, hedging, or padding.
8. **Audit the draft against every rule in step 7** and cut or rewrite anything that breaks one before replying.

**Decision discipline**

- List any assumptions explicitly and keep them minimal.
- Say plainly when evidence is missing, and what you would need to be sure.

**Quality/Safety constraints**

- This command thinks and explains. Do not edit, create, or delete project files.
- Do not widen the problem into unrelated improvements.
- Do not recommend a library, API, or function without confirming it exists in the project's declared dependencies or in current documentation.

## Output (OUTPUT)

### Human-Readable Report

Return a short, scannable answer in plain language at a 16-year-old reading level:

- **The problem**: 1-2 sentences, including what counts as solved.
- **What the project already does**: the existing design and decisions the answer has to respect, in plain words.
- **The recommendation**: what to do, and why it is right from first principles.
- **How it fits the current design**: where it sits and which existing decisions it honours.
- **Architecture change**: "None needed", or exactly what changes, why, and what it costs.
- **Trade-offs and risks**: only real ones.
- **Assumptions**: only if you made any.
- **Questions**: numbered list, only if you are blocked.
