---
description: Infer the active prioritisation lens from the PRD, TAD, vertical-slice architecture guidance, and recent feat/fix commits, then recommend the next feature build and one alternate with the decision frame fully disclosed.
allowed-tools: Agent, Bash(test:*), Bash(git log:*), AskUserQuestion
---

# /set-heading: Set The Feature Heading

## Philosophy (Why this exists)

Feature recommendations are never neutral: they answer an implicit question about which dimension the decision should be evaluated by. This command makes that lens visible by inferring the current product decision frame, disclosing the evidence and trade-offs behind it, and then recommending a vertical feature slice that the user can challenge at the frame level, not just accept or reject as a feature.

## Process (PROCESS)

Follow these steps in order:

1. **Check invocation and required files.**
   - If the command was invoked with any arguments, stop and ask the user to re-run `/set-heading` with no arguments.
   - Confirm the following three sources are present and usable: `.agents/PRD.md`, `.agents/TAD.md`, and `.agents/reference/vertical-slice-architecture-setup-guide.md`.
   - If any of the three is missing, empty, or unreadable, stop and ask for the correct location before proceeding.

2. **Run the recent-work agent.**
   - Spawn exactly one sub-agent with `subagent_type|agent_type: "general-purpose"`.
   - Instruct the sub-agent to return the latest 6 Git commits whose subject begins with commit type `feat` or `fix`, including scoped forms such as `feat(parser):` and `fix(api):`.
   - Tell the sub-agent to use this command unless it has a better equivalent:
     - `git log --max-count=6 --extended-regexp --grep='^(feat|fix)(\([^)]+\))?!?:' --format=fuller --stat`
   - Instruct the sub-agent to return the full Git output for each matching commit, including the commit hash.
   - Wait for the sub-agent response before continuing.

3. **Extract decision signals from the PRD and TAD.**
   - Identify explicit and strongly implied signals about:
     - product goals
     - current product stage
     - unproven assumptions
     - core risks
     - success criteria
     - user value
     - business value
     - technical constraints
     - architecture and sequencing constraints
     - data/input viability
     - operational viability
   - Mark each signal as `Explicit` or `Inferred`.

4. **Infer the active decision dimensions.**
   - Choose the top 2-3 priority dimensions from exactly this set of seven:
     - `Strategic importance`: does this matter most to the product or business right now?
     - `Core assumption validation`: does this prove the product's central promise can work?
     - `User value`: does this create direct, meaningful value for the target user?
     - `Enabling value`: does this unlock or accelerate future work?
     - `Delivery risk`: can this be built with acceptable technical, data, and scope risk?
     - `Speed of feedback`: how quickly and clearly will this produce useful evidence?
     - `Reversibility`: how costly is it to change direction if this is wrong?
   - For each selected dimension, provide PRD/TAD evidence, recent-commit evidence if relevant, confidence level (`High|Medium|Low`), and the main assumption that could be wrong.
   - If a selected dimension is supported by only one piece of evidence, set confidence to `Low` to avoid over-interpreting one-off evidence.
   - Identify at least 1 dimension that is intentionally de-emphasised and explain why.
   - If two decision frames are similarly plausible, choose one and disclose the alternate frame. Do not stop for confirmation.

5. **Assess vertical-slice feasibility context.**
   - Identify the VSA constraints that materially affect what can count as a valid next feature build under the selected decision dimensions.
   - Use the PRD, TAD, VSA reference, and recent commit pattern to understand viable feature-slice boundaries.

6. **Evaluate and recommend the next feature build and one alternate.**
   - Evaluate what to build next from the PRD/TAD using the selected 2-3 decision dimensions from Step 4 as the prioritisation criteria.
   - Ground the evaluation in the PRD/TAD signals from Step 3, the recent commit pattern from Step 2, and the VSA feasibility context from Step 5.
   - Recommend exactly one primary next feature and exactly one alternate feature.
   - Make the primary recommendation the best fit for the selected 2-3 decision dimensions.
   - Make the alternate recommendation meaningfully different, not a smaller version of the same feature.
   - For each feature, define:
     - the feature in 1-2 sentences
     - the vertical slice boundary
     - the VSA fit
     - the user-visible or product-visible workflow
     - the core risk or assumption it addresses
     - the evidence it would generate
     - why it should be built before the strongest competing options
     - the observable acceptance criteria
     - the smallest useful "done" standard

7. **Prepare the report.**
   - Use the Human-Readable Report format below.
   - Prioritise clear disclosure over persuasion.
   - State uncertainty directly.
   - Do not ask for confirmation before presenting the recommendations.

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.
- If the evidence is implicit, label it as an inference.
- Do not instruct the sub-agent to provide advice or recommendations.
- The user owns the final decision; your job is to make transparent recommendations, not to make the decision irreversible.

**Quality/Safety constraints**

- Do not implement the feature.
- Do not edit, create, stage, or commit files.
- Do not produce an implementation plan or task execution checklist.
- Do not mention invocation prerequisites or prior commands.
- Do not invent PRD/TAD evidence; distinguish evidence from interpretation.
- Do not recommend horizontal infrastructure work unless it is required to make the vertical slice testable.

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return a concise, easy-to-scan summary in plain language at a 16-year-old reading level:

- **Status**: `Success` | `Blocked`
- **Recent feat/fix pattern**:
  - List the commit hashes and subjects used for analysis.
  - Summarise the pattern in 2-3 bullets.
- **Signals behind the frame**:
  - List only the strongest explicit and inferred PRD/TAD signals.
  - Mark each signal as `Explicit` or `Inferred`.
- **Decision frame**:
  - List the top 2-3 selected dimensions.
  - For each: evidence (PRD, TAD and/or commits), confidence level, and main assumption.
  - List any materially de-emphasised dimensions and why.
- **Primary next feature recommendation**:
  - Feature name
  - Feature summary
  - Vertical slice boundary
  - VSA fit
  - Workflow to prove
  - Risk or assumption addressed
  - Evidence generated
  - Observable acceptance criteria
  - Smallest useful done standard
- **Alternate feature recommendation**:
  - Same fields as the primary recommendation, but shorter.
  - Explain how it differs from the primary on the selected dimensions.
- **Decision sensitivity**:
  - State any plausible alternate decision frame and how the recommendation would change if that frame were actually most important.
- **Open questions**:
  - Include only questions that materially affect the user's decision.
