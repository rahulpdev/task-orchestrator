---
description: Review the full conversation, extract the current problem definition, test it against required standards, and return a concise human report with gaps, a standards verdict, and a cleaner replacement definition that records settled decisions and names any open decisions.
argument-hint: [comment] (optional - free-form user comment to include as current-turn context)
allowed-tools: Read, AskUserQuestion
---

# /find-position: Find The Problem Position

## Philosophy (Why this exists)

Long conversations drift. This command forces the agent to stop, say the real problem in plain words, and check whether that problem is sharp enough to support a good decision.

A weak problem definition makes later choices noisy and can produce solution plans for the wrong problem. This command is a convergence tool: it narrows and sharpens the problem before later stage planning turns it into solutions.

A problem definition is only clean when it can be acted on without inventing missing intent.

## Input (INPUT)

User comment from invocation: $ARGUMENTS

This comment is optional. If present, treat it as the user's latest comment in the conversation before running the command.

## Process (PROCESS)

Follow these steps in order:

1. Incorporate invocation comment.
   - If `$ARGUMENTS` is present, treat it as current-turn context for this assessment.
   - Do not let it override earlier settled decisions unless it clearly reverses or reopens them.
2. Read the full conversation so far from the first turn to the latest turn.
   - Do not skip turns.
   - Track explicit statements and strong implicit signals about the goal, scope, constraints, non-goals, success criteria, assumptions, proposed solutions, and settled decisions.
   - Ignore conversational process, wording debates, acknowledgements, and other meta-discussion.
3. Run a settled decision check.
   - Scan the conversation for explicit user decisions that affect the current loop.
   - Treat a decision as settled when the user agrees to an option, selects a proposed path, or confirms a direction, unless a later turn clearly reverses or reopens it.
4. Extract the current problem definition.
   - Restate the single best implicit or explicit problem definition in 1-3 short sentences.
   - Distinguish clearly between the problem to solve versus any candidate solutions or any decision choice questions under discussion.
   - If the conversation contains multiple competing definitions, choose the most current one, then record the conflict as an issue.
   - If no stable problem definition can be extracted, say so explicitly and treat that as a failed assessment.
5. Validate decision preservation before assessment.
   - Check that the Step 4 problem definition does not contradict any explicit user decision from Step 3 that affects this loop.
   - Do not treat an explicit user decision as unresolved just because related details are incomplete.
   - Preserve agreed implementation choices as context when assessing whether the current loop is already decided.
6. Assess the extracted problem definition against these standards.
   - **Problem slicing**: Is the problem reduced to one specific, implementation-worthy unit for this loop?
   - **Constraint articulation**: Are boundaries, assumptions, and non-goals explicit?
   - **Outcome clarity**: Is "done" concrete enough to guide design choices? For every named requirement, the expected outcome must be classified as one of: `must succeed`, `may degrade`, `must warn`, `must fail`, `deferred`, `out of scope`.
   - **Scope and done alignment**: Every item in scope is reflected in "done"; every item in "done" is introduced in scope. Best-effort or warning-only items are named as such on both sides. A scope item with no "done" item is a fail on its own.
   - **Handoff safety**: Can this definition be used to design a solution without inventing product behaviour, acceptance thresholds, or failure semantics?
   - **Solution separation**: Are agreed implementation choices kept out of the problem statement and the "done" criteria, and recorded under settled decisions rather than dropped?
7. Identify all definition gaps.
   - Include vague or overly broad framing.
   - Include solution-shaped language in the problem statement or the "done" criteria.
   - Include any settled decision from Step 3 that the definition neither records nor honours.
   - Include missing constraints or boundaries.
   - Include unclear or non-operational success criteria.
   - Include blurred scope between this loop and later work.
   - Include any named requirement with unclassified outcome semantics.
   - Include any product behaviour, acceptance thresholds, or failure semantics this definition would force its user to invent because it does not state it.
8. Surface the reasoning issues behind the definition.
   - Identify assumptions, inferences, missing evidence, weak logic, and inconsistent logic.
   - For every issue you report, assign one primary label from this fixed set:
     - `Weak reasoning`
     - `Unsupported claim`
     - `Missing evidence`
     - `Assumption`
     - `Inference`
   - If an issue could fit more than one label, choose the most fundamental label.
9. Decide the standards verdict.
   - Use exactly one of these phrases:
     - `Meets required standards`
     - `Meets required standards — open decisions named`
     - `Blocked — no stable problem definition`
   - Use `Meets required standards` when Step 4 extracted a stable definition and Step 7 produced no gap that would force its user to invent product behaviour, acceptance thresholds, or failure semantics.
   - Use `Meets required standards — open decisions named` when Step 4 extracted a stable definition but Step 7 named at least one such gap.
   - Use `Blocked — no stable problem definition` when Step 4 could not extract a stable definition.
10. Write a clean replacement problem definition.
    - Keep it as a suggested path forward, not a shutdown of the conversation.
    - State what is in scope and out of scope.
    - Keep solution language out of the problem statement and the "done" criteria.
    - Record every settled decision from Step 3 that binds a solution, including agreed implementation choices and rulings a solution must not contradict, in its own section and at the level of the ruling.
    - List the reference files a solution must honour, each by its path in this repository.
    - Define one responsibility for this loop.
    - Define "done" in concrete terms.
    - For every named requirement in scope, classify the expected outcome as one of: `must succeed`, `may degrade`, `must warn`, `must fail`, `deferred`. Items classified `out of scope` belong in the `Out of scope` bullet list, not in `Done means`.
    - Carry unresolved ambiguity visibly. Do not smooth over an open decision by silently picking one interpretation; name it as an open decision instead.
    - When the definition is re-issued after new decisions, rebuild it from the full process and re-run Step 6 on the result rather than patching the previous text.
11. Prepare the report.
    - Prioritise precision over explanation.

**Decision discipline**

- If the conversation is too early for a meaningful problem definition to exist, say that directly.
- If you must make assumptions, list them explicitly and keep them minimal.
- If the conversation does not contain enough evidence to support a claim, say that directly.

**Quality/Safety constraints**

- Base every claim on the conversation. Mark inferences as inferences.
- Do not invent missing evidence, constraints, goals, or agreement.
- Do not ignore or downgrade explicit user agreement because another part of the definition is still incomplete.
- Do not turn a solution idea into the problem definition.
- Do not suggest actions, plans, or next steps in the final report.
- Keep the focus on the current loop, not the whole product, unless the conversation truly stayed product-wide.
- Do not silently resolve ambiguity inside the clean replacement definition. Open decisions must be named, not absorbed.
- Do not classify a definition as `Meets required standards` when acting on it would require inventing product behaviour, acceptance thresholds, or failure semantics.

## Output (OUTPUT)

### Human-Readable Report

Return a concise, easy-to-scan report using precise, plain and simple language:

- **Verdict**: Use the exact phrase from Step 9.
- **Extracted problem definition (as understood)**: 1-3 short sentences, or `No stable problem definition found.`
- **Decision preservation check**: one short sentence confirming whether settled decisions from Step 3 were preserved during the assessment.
- **Standards check**:
  - `Problem slicing`: `Pass` | `Fail` — one short sentence
  - `Constraint articulation`: `Pass` | `Fail` — one short sentence
  - `Outcome clarity`: `Pass` | `Fail` — one short sentence
  - `Scope and done alignment`: `Pass` | `Fail` — one short sentence
  - `Handoff safety`: `Pass` | `Fail` — one short sentence
  - `Solution separation`: `Pass` | `Fail` — one short sentence
- **Issues**:
  - Use a numbered list.
  - For each item include: `Label`, `Issue`, `Evidence`, `Why it matters`.
  - Use one primary label from this fixed set: `Weak reasoning`, `Unsupported claim`, `Missing evidence`, `Assumption`, `Inference`.
  - If no issues exist, write `No material gaps found.`
- **Settled decisions used**: short bullet list of explicit decisions that affected the assessment, or `None found.`
- **Suggested clean problem definition**:
  - `Problem`: one short paragraph
  - `In scope`: short bullet list
  - `Out of scope`: short bullet list
  - `Settled decisions and constraints`: short bullet list of rulings that bind any solution, or `None`
  - `Reference files`: short bullet list of repository paths a solution must honour, or `None`
  - `Done means`: short bullet list; each item carries its outcome classification (`must succeed`, `may degrade`, `must warn`, `must fail`, `deferred`)
  - `Open decisions`: short bullet list of decisions the user must resolve before acting on this definition, or `None`

## Notes

- Use this command during discussions on problem definition when a long conversation may have drifted or become solution-shaped.
