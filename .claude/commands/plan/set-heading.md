---
description: Infer the active prioritisation lens from the PRD, TAD, any architecture guide supplied, and recent feat/fix commits, then recommend the next feature build and one alternate with the decision frame fully disclosed, save the report, and have the document-reviewer sub-agent read the saved report and correct its wording.
argument-hint: <prd-path> <tad-path> [architecture-guide-path] (required - the PRD and the TAD; optional - an architecture guide, such as a vertical-slice architecture guide; paths must not contain spaces)
allowed-tools: Read, Write, Edit, Agent, Bash(test:*), Bash(mkdir:*), Bash(date:*), Bash(git log:*), AskUserQuestion
---

# /set-heading: Set The Feature Heading

## Philosophy (Why this exists)

Feature recommendations are never neutral: they answer an implicit question about which dimension the decision should be evaluated by. This command makes that lens visible by inferring the current product decision frame, disclosing the evidence and trade-offs behind it, and then recommending a vertical feature slice that the user can challenge at the frame level, not just accept or reject as a feature.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/plan:set-heading docs/PRD.md docs/TAD.md`
- `/plan:set-heading docs/PRD.md docs/TAD.md .agents/reference/vertical-slice-architecture-setup-guide.md`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Mandatory**: The PRD and TAD paths are required. If missing/invalid, stop and ask.

**Argument contract**

- Required args: `$ARGUMENTS` -- whitespace-separated file paths, in this order: the PRD, then the TAD.
- Optional args: a third path to an architecture guide.
- Defaults: None. Without a third path, architecture constraints are drawn from the TAD and the codebase.
- Validation rules: each supplied path must be an existing, non-empty file.

**If arguments are missing/invalid**

- Stop and ask for the missing or correct path before running any sub-agent.

## Process (PROCESS)

Follow these steps in order:

1. **Validate the arguments.**
   - Split `$ARGUMENTS` on whitespace. The first path is the PRD, the second the TAD, and the optional third an architecture guide.
   - If fewer than two paths are present, stop and ask for the PRD and TAD paths.
   - Run `test -s <path>` on each supplied path. If any is missing or empty, stop and ask for the correct location before proceeding.

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

5. **Assess architecture feasibility context.**
   - Identify the architecture constraints that materially affect what can count as a valid next feature build under the selected decision dimensions. Take them from the architecture guide when one was supplied, otherwise from the TAD and the codebase.
   - Use the PRD, TAD, the architecture guide when supplied, and recent commit pattern to understand viable feature-slice boundaries.

6. **Evaluate and recommend the next feature build and one alternate.**
   - Evaluate what to build next from the PRD/TAD using the selected 2-3 decision dimensions from Step 4 as the prioritisation criteria.
   - Ground the evaluation in the PRD/TAD signals from Step 3, the recent commit pattern from Step 2, and the architecture feasibility context from Step 5.
   - Recommend exactly one primary next feature and exactly one alternate feature.
   - Make the primary recommendation the best fit for the selected 2-3 decision dimensions.
   - Make the alternate recommendation meaningfully different, not a smaller version of the same feature.
   - For each feature, define:
     - the feature in 1-2 sentences
     - the vertical slice boundary
     - the architecture fit
     - the user-visible or product-visible workflow
     - the core risk or assumption it addresses
     - the evidence it would generate
     - why it should be built before the strongest competing options
     - the observable acceptance criteria
     - the smallest useful "done" standard

7. **Prepare the report.**
   - Use the layout in the Saved File section.
   - Prioritise clear disclosure over persuasion.
   - State uncertainty directly.
   - Do not ask for confirmation before presenting the recommendations.

8. **Save the report.**
   - Write the report from Step 7 as the Saved File section describes, taking the time for its title from `date '+%Y-%m-%d %H:%M:%S'` and creating the `docs/options/` folder if it does not exist.

9. **Run the document review.**
   - Start the `document-reviewer` sub-agent once, using the agent spawning tool with `subagent_type|agent_type: "document-reviewer"`, and pass it two paths and nothing else: the communication standard at `.agents/reference/communication-standard.md` and the file written in Step 8.
   - Follow the instruction that closes its response, using Edit on the saved file only.
   - Correct wording only. Do not change which feature is the primary or the alternate, a selected dimension, a confidence level, an acceptance criterion or a done standard, and ignore any finding against a field name the Saved File section fixes.
   - If the sub-agent cannot be started, or reports that it is blocked, leave the file as written in Step 8 and say so in the final response.

10. **Return the final response.**
    - Use the Human-Readable Report in the Output section.

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.
- If the evidence is implicit, label it as an inference.
- Do not instruct the sub-agent to provide advice or recommendations.
- The user owns the final decision; your job is to make transparent recommendations, not to make the decision irreversible.

**Quality/Safety constraints**

- Do not implement the feature.
- Do not edit or create any file other than the report file.
- Stage nothing and commit nothing.
- Do not produce an implementation plan or task execution checklist.
- Do not mention invocation prerequisites or prior commands.
- Do not invent PRD/TAD evidence; distinguish evidence from interpretation.
- Do not recommend horizontal infrastructure work unless it is required to make the vertical slice testable.

## Saved File (OUTPUT)

- **Path**: `docs/options/<slug>-heading.md`
- **Naming rule**: `<slug>` is a concise kebab-case slug, of three words where three are clear, made from the name of the primary feature recommended in Step 6.
- **Written for**: a human.
- **If the file already exists**: Stop and ask before overwriting it.

**Layout**

Write a concise, easy-to-scan summary to the report file:

- **Title**: a first-level heading, `# Feature Heading: <primary feature name>`, then the date and time.
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
  - Architecture fit
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

The saved file contains only the parts above. Explain a term inside the part where it first appears.

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return a concise summary, and repeat nothing that is in the file:

- **Status**: `Success`, or `Blocked` with the reason if the file could not be written.
- **File**: the path of the saved report, on its own line.
- **Slug**: the slug used, then this reminder: `The slug is yours to choose. Name the slug you want in the conversation before you first run /plan:fix-position, or it will choose one for you. Rename this report to match if the two differ.`
- **Document review**: what the document-reviewer's closing instruction says to tell the user, or that the review did not run.

## Notes

- The `document-reviewer` sub-agent must be present in `.claude/agents/`, or the document review in Step 9 cannot run.
