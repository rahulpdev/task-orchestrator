---
description: Review the conversation, state the current problem definition, check it against required standards, report the gaps found and a verdict, save a cleaner replacement definition that records settled decisions and names any open decisions.
argument-hint: [comment] (optional - free-form user comment to include as current-turn context)
allowed-tools: Read, Write, Edit, Agent, Bash(mkdir:*), AskUserQuestion
---

# /fix-position: Fix The Problem Definition

## Philosophy (Why this exists)

Long conversations drift. This command forces the agent to stop, say the real problem in plain words, and check whether that problem is sharp enough to support a good decision.

A weak problem definition makes later choices hard to judge and can produce solution plans for the wrong problem. This command narrows and sharpens the problem before the planning commands that come after it propose solutions.

A problem definition is only clean when it can be acted on without inventing missing intent.

## Input (INPUT)

User comment from invocation: $ARGUMENTS

This comment is optional. If present, treat it as the user's latest comment in the conversation before running the command.

## Process (PROCESS)

Follow these steps in order:

1. Incorporate invocation comment.
   - If `$ARGUMENTS` is present, treat it as the user's latest comment for this assessment.
   - Do not let it override earlier settled decisions unless it clearly reverses or reopens them.
2. Read the full conversation so far from the first turn to the latest turn.
   - Track explicit statements and strong implicit signals about the goal, scope, constraints, non-goals, success criteria, assumptions, proposed solutions, and settled decisions.
   - Ignore conversational process, wording debates, acknowledgements, and other meta-discussion.
3. Run a settled decision check.
   - Scan the conversation for explicit user decisions that affect the current loop, the one piece of work this round of planning and building is for.
   - Treat a decision as settled when the user agrees to an option, selects a proposed path, or confirms a direction, unless a later turn clearly reverses or reopens it.
4. Extract the current problem definition.
   - Restate the single best implicit or explicit problem definition in 1-3 short sentences.
   - Keep the problem to solve separate from any proposed solutions and from any choices the user is still deciding between.
   - If the conversation contains multiple competing definitions, choose the most current one, then list the conflict under Issues.
   - If no stable problem definition can be extracted, say so explicitly and give the `Blocked: no stable problem definition` verdict in Step 9.
5. Validate decision preservation before assessment.
   - Check that the Step 4 problem definition does not contradict any explicit user decision from Step 3 that affects this loop.
   - Do not treat an explicit user decision as unresolved just because related details are incomplete.
   - Preserve agreed implementation choices as context when assessing whether the current loop is already decided.
6. Assess the extracted problem definition against these standards.
   - **Problem slicing**: Is the problem narrowed to one specific piece of work worth building in this loop?
   - **Constraint articulation**: Are boundaries, assumptions, and non-goals explicit?
   - **Outcome clarity**: Is "done" concrete enough to guide design choices? For every requirement the definition names, the expected outcome must be classified as one of: `must succeed`, `may degrade`, `must warn`, `must fail`, `deferred`, `out of scope`.
   - **Scope and done alignment**: Every item in scope is reflected in "done"; every item in "done" is introduced in scope. Best-effort or warning-only items are named as such on both sides. A scope item with no "done" item is a fail on its own.
   - **Handoff safety**: Can whoever designs a solution use this definition without inventing product behaviour, acceptance thresholds, or failure semantics?
   - **Solution separation**: Are agreed implementation choices kept out of the problem statement and the "done" criteria, and recorded under settled decisions rather than dropped?
7. Identify all definition gaps.
   - Include vague or overly broad framing.
   - Include any proposed solution that appears in the problem statement or the "done" criteria.
   - Include any settled decision from Step 3 that the definition neither records nor honours.
   - Include missing constraints or boundaries.
   - Include unclear or non-operational success criteria.
   - Include blurred scope between this loop and later work.
   - Include any requirement the definition names that has no outcome classification.
   - Include any product behaviour, acceptance thresholds, or failure semantics this definition would force whoever designs the solution to invent because it does not state them.
8. Surface the reasoning issues behind the definition.
   - Identify assumptions, inferences, missing evidence, and weak or inconsistent reasoning.
   - For every issue you report, assign one primary label from this fixed set:
     - `Weak reasoning`
     - `Unsupported claim`
     - `Missing evidence`
     - `Assumption`
     - `Inference`
   - If an issue could fit more than one label, choose the label closest to its root cause.
9. Decide the standards verdict.
   - Use exactly one of these phrases:
     - `Meets required standards`
     - `Meets required standards, with open decisions named`
     - `Blocked: no stable problem definition`
   - Use `Meets required standards` when Step 4 extracted a stable definition and Step 7 produced no gap that would force whoever designs the solution to invent product behaviour, acceptance thresholds, or failure semantics.
   - Use `Meets required standards, with open decisions named` when Step 4 extracted a stable definition but Step 7 named at least one such gap.
   - Use `Blocked: no stable problem definition` when Step 4 could not extract a stable definition.
10. Write a clean replacement problem definition.
    - Present it as a proposal the user can accept or change, not as the end of the discussion.
    - State what is in scope and out of scope.
    - Keep solution language out of the problem statement and the "done" criteria.
    - Record every settled decision from Step 3 that binds a solution, including agreed implementation choices and rulings a solution must not contradict, in its own section and at the level of the ruling.
    - List the reference files a solution must honour, each by its path in this repository.
    - Give this loop a single responsibility: one thing it must achieve.
    - Define "done" in concrete terms.
    - For every requirement in scope, classify the expected outcome as one of: `must succeed`, `may degrade`, `must warn`, `must fail`, `deferred`. Items classified `out of scope` belong in the `Out of scope` bullet list, not in `Done means`.
    - Carry unresolved ambiguity visibly. Do not smooth over an open decision by silently picking one interpretation; name it as an open decision instead.
    - When the definition is re-issued after new decisions, rebuild it by repeating Steps 1 to 10 and re-run Step 6 on the result rather than patching the previous text.
11. Save the definition.
    - Write the clean replacement problem definition from Step 10 to `docs/options/<slug>-problem-definition.md`, in the layout under Saved Definition below, creating the folder if it does not exist and replacing any earlier version.
    - Use the slug already settled in this conversation. On the first run, make a concise kebab-case slug for the problem, of two to three words.
12. Run the document review.
    - Start the `document-reviewer` sub-agent once, using the agent spawning tool with `subagent_type|agent_type: "document-reviewer"`, and pass it two paths and nothing else: the communication standard at `.agents/reference/communication-standard.md` and the file saved in Step 11.
    - Follow the instruction that closes its response, using Edit on the saved file only.
    - Correct wording only. Do not add, remove or change a decision, a constraint, a scope item, a reference file or a completion condition, and ignore any finding against a part name listed under Saved Definition.
    - If the sub-agent cannot be started, or reports that it is blocked, leave the file as saved in Step 11 and say so in the report.
13. Prepare the report.
    - Use the report format under the Output section below. Be precise, and explain any term or label the user may not know where it first appears.

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
- Keep the focus on the piece of work the conversation is about. Widen it to the whole product only if the conversation itself was about the whole product.
- Do not silently resolve ambiguity inside the clean replacement definition. Open decisions must be named, not absorbed.
- Do not classify a definition as `Meets required standards` when acting on it would require inventing product behaviour, acceptance thresholds, or failure semantics.
- Do not put the clean replacement definition in the report; it goes only in the saved file.

## Saved Definition

Lay out the clean replacement problem definition from Step 10 in these parts, in this order:

- `Problem`: one short paragraph
- `In scope`: short bullet list
- `Out of scope`: short bullet list
- `Settled decisions and constraints`: short bullet list of rulings that bind any solution, or `None`
- `Reference files`: short bullet list of repository paths a solution must honour, or `None`
- `Done means`: short bullet list; each item carries its outcome classification (`must succeed`, `may degrade`, `must warn`, `must fail`, `deferred`)
- `Open decisions`: short bullet list of decisions the user must resolve before acting on this definition, or `None`

## Output (OUTPUT)

### Human-Readable Report

Return a concise, easy-to-scan report:

- **Verdict**: Use the exact phrase from Step 9.
- **Extracted problem definition (as understood)**: 1-3 short sentences, or `No stable problem definition found.`
- **Decision preservation check**: one short sentence confirming whether settled decisions from Step 3 were preserved during the assessment.
- **Standards check**:
  - `Problem slicing`: `Pass` or `Fail`, then one short sentence
  - `Constraint articulation`: `Pass` or `Fail`, then one short sentence
  - `Outcome clarity`: `Pass` or `Fail`, then one short sentence
  - `Scope and done alignment`: `Pass` or `Fail`, then one short sentence
  - `Handoff safety`: `Pass` or `Fail`, then one short sentence
  - `Solution separation`: `Pass` or `Fail`, then one short sentence
- **Issues**:
  - Use a numbered list.
  - For each item include: `Label`, `Issue`, `Evidence`, `Why it matters`.
  - Use one primary label from this fixed set: `Weak reasoning`, `Unsupported claim`, `Missing evidence`, `Assumption`, `Inference`.
  - If there are no gaps or reasoning issues, write `No material gaps or issues found.`
- **Settled decisions used**: short bullet list of explicit decisions that affected the assessment, or `None found.`
- **Saved definition**: the path of the file saved in Step 11.
- **Document review**: what the document-reviewer's closing instruction says to tell the user, or that the review did not run.

## Notes

- Use this command when a long conversation about a problem may have drifted, or started proposing solutions instead of defining the problem.
- The filename this command writes is the single source of truth for the slug. Downstream chain commands write next to the problem definition, in `dirname(<problem-definition-path>)`, and take the slug from its filename by removing the `-problem-definition.md` ending.
- The `document-reviewer` sub-agent must be present in `.claude/agents/`, or the document review in Step 12 cannot run.
