# PIV Loop Reference (Plan → Implement → Validate)

## 1) Purpose and Scope

- Provide a single source that explains the PIV Loop, extended stages, commands, planning layers, validation, and system evolution.
- Allow a reader to run reliable AI‑assisted development without rewatching transcripts.
- Applicable to greenfield and brownfield codebases, single or repeated loops, manual or semi‑automated workflows.

## 2) Why the PIV Loop Exists

- AI coding is powerful but drifts without structure; PIV supplies that structure.
- Keeps humans in control of intent (Plan) and quality (Validate) while AI handles execution.
- Reduces AI assumptions by forcing explicit context and tasks.
- Supports repeatable, auditable progress through artifacts (plans, reports, commits).
- Serves as the backbone for commands, rules, and later automation/remote workflows.

## 3) Problems the PIV Loop Solves

- Unstructured prompting (“vibe coding”) leads to partial context and unpredictable code.
- Large tasks overflow context windows; PIV encourages small, manageable iterations.
- Without planned validation, AI may skip tests or ship regressions.
- Existing codebases need clear integration points; PIV surfaces them during planning.
- Human oversight can fade; PIV inserts mandatory checkpoints.
- Over‑engineering and backwards‑compatibility bloat are curbed by plan review.

## 4) Core Loop Overview

- Sequence: **Plan → Implement → Validate → iterate**.
- Humans are primary in Plan and Validate; AI leads Implement with supervision.
- Each iteration is intentionally small: one tool, endpoint, or feature slice.
- Outputs per loop: working change, validation results, lessons for system evolution.
- Inputs per loop: current codebase, Layer One rules/PRD, new feature goal, relevant references.

## 5) Core Stage: Plan

- Objective: Align on _what_ to build and _how_ to measure success.
- Begins in a fresh chat to avoid stale context.
- Two sub‑phases: Vibe Planning then Structured Plan.
- Vibe Planning: casual, exploratory, option gathering, risk identification, integration discovery.
- Structured Plan: formal markdown anchored by context engineering pillars.
- Sections typically include: goals, success criteria, user story, assumptions, docs to reference, relevant files, task list, validation strategy, desired structure, risks.
- Plan aims to minimize AI assumptions; explicit beats implicit.

## 6) Core Stage: Implement

- Objective: Execute the structured plan task‑by‑task.
- New chat; load plan (and rules if needed); avoid prior conversation noise.
- AI reads plan, locates files, writes code, runs planned validations.
- Mantra: **trust but verify**; monitor reasoning tokens to ensure plan adherence.
- Human intervenes if AI skips tasks, misreads plan, or touches wrong files.
- Implementation ends when all tasks and embedded validations are done.

## 7) Core Stage: Validate

- Objective: Confirm correctness, safety, and alignment with plan.
- AI runs scripted checks from the plan (lint, types, tests, integration commands).
- Human performs code review and manual testing of the feature in a realistic flow.
- Ask AI to explain unfamiliar code or architectural choices discovered during review.
- Re‑run validations after fixes; stop only when results are clean and human is satisfied.

## 8) Extended Stage: Prime

- Purpose: Prepare the AI with codebase understanding before planning.
- Reads README, architecture files, key directories, global rules, PRD, on‑demand guides.
- Can be specialized (e.g., “prime for tools”, “prime front‑end”) by scoping files and references.
- Output is a concise summary; human checks for gaps and correct focus.

## 9) Extended Stage: Commit

- Purpose: Create a safe checkpoint after validation.
- Stages and commits all relevant files with descriptive message.
- Recommended flow: commit after final plan (optional), and after validated implementation (mandatory).
- Enables easy rollback and reproducible history between loops.

## 10) Planning System: Two Layers

- **Layer One (Project planning):** tech stack, architecture patterns, logging/testing rules, global rules, on‑demand context, command set, PRD. Created once and updated sparingly.
- **Layer Two (Task planning):** per‑feature planning executed each PIV loop; produces structured plan; adapts to current goal.
- Relationship: Layer One constrains and informs Layer Two; Layer Two must not contradict Layer One.
- Layer One stays mostly outside the loop execution but is always referenced.

## 11) Layer Two Workflow in Detail

- Start with Prime if the AI lacks current context.
- Vibe Planning: explore options, ask about risks, integration points, and unknowns; gather decisions.
- Move to Structured Plan creation:
  - Apply context engineering pillars: memory (chat log), RAG (rules, PRD, prior plans, docs), prompt structure (sections), task management (ordered checklist).
  - Record assumptions explicitly to shrink AI guesswork.
  - Define validation strategy now so AI executes it later automatically.
  - Note relevant files/integration points for existing codebases.
- Human reviews the plan for concision, avoidance of over‑engineering, and clear success criteria; iterate until comfortable.
- Optional: trim plan line count to reduce context bloat before execution.

## 12) Implementation Methodology (Executing the Plan)

- Fresh chat; attach structured plan; include rules only if needed.
- Instruct AI to follow tasks sequentially; avoid parallel multi‑file thrash.
- Monitor reasoning tokens for signs of partial plan reads or misinterpretation.
- Encourage AI to run lint, type checks, unit and integration tests as specified in the plan.
- Keep feature scope tight; if work expands, split into another loop.
- If AI drifts or fails, revert to pre‑implementation commit, refine plan or rules, and rerun.

## 13) Validation System Overview

- Validation is shared: AI handles mechanical checks; humans ensure intent and UX.
- Embedding validation in the plan increases automation and reduces omissions.
- Manual validation (code review + hands‑on testing) is always required.
- Failed validation is a loop, not a dead end: fix, rerun checks, or revert and retry.

## 14) Validation Pyramid (Five Levels)

- **Level 1: Syntax & Style** — format/lint for consistency (examples in transcripts: Ruff, ESLint analogues implied by pattern).
- **Level 2: Type Safety / Static Analysis** — mypy/pyright for Python or TS types; catch interface errors early.
- **Level 3: Unit Tests** — small, focused tests on functions/components; cover edge cases and ensure regression coverage.
- **Level 4: Integration / End‑to‑End Tests** — run the application; hit endpoints or UI flows (curl, plugin UI, etc.); verify components together.
- **Level 5: Human Review** — strategic alignment, security judgment, UX, intent matching; ask AI clarifying questions.
- AI typically executes Levels 1–4 when instructed; humans always perform Level 5.
- Pyramid should appear in every structured plan or validation command.

## 15) Command System Architecture (Core Set)

- Commands use **Input → Process → Output** framing to make expectations explicit.
- **Prime:** gathers project context; may accept focus arguments; outputs understanding summary.
- **Plan (template/plan‑feature):** conducts research and produces structured plan; uses context engineering pillars; keeps outputs in markdown.
- **Execute:** reads plan; runs tasks in order; ensures validations in the plan are executed; reports changed files and results.
- **Validate:** runs the validation pyramid outside of a plan when needed (e.g., after ad‑hoc fixes).
- **Commit:** stages/commits changes; may limit to specified files; outputs commit details.
- Validation helpers:
  - **Code Review:** scans changed/added files for logic, security, performance, style; outputs a review report.
  - **Code Review Fix:** consumes a review report or human issue list; applies fixes sequentially; reruns validation.
  - **System Review:** compares plan vs implementation to find divergences and suggest rule/template updates.
- Reliability helpers:
  - **Root Cause Analysis (RCA):** analyzes a defect; writes a report with cause and plan.
  - **Implement Fix:** applies RCA plan, runs validation, summarizes changes.
- **Command Chaining:** prime → plan → execute → commit in one flow when trust is high; still allow human checkpoints.
- Explicit arguments reduce AI assumptions (paths, issue IDs, scope flags, model choices).

## 16) Universal Command Patterns (Design Notes)

- State purpose and output consumer at the top.
- Load necessary context explicitly (rules, PRD, references, prior reports).
- Keep outputs human‑readable (markdown) and machine‑consumable (consistent sections).
- Allow optional parameters to focus scope (front‑end only, tools only, specific issue ID).
- Keep commands modular so they can run alone or chained.
- Use structured outputs (task lists, summaries, file lists) to ease downstream steps.
- Encourage AI to note uncertainties and ask before risky changes.

## 17) Multi‑PIV Loop Execution Patterns

- Use many small loops instead of one large push; each loop handles a cohesive slice.
- Example pattern: loop 1 build base agent; loop 2 connect Obsidian plugin; loops 3–n add tools one by one.
- Each loop ends with validation + commit; lessons feed into updated rules/templates.
- Saved plans and reports act as on‑demand context for later loops.
- Failed loops are cheap: revert to prior commit, refine plan, rerun.

## 18) Multi‑Agent and Automation Notes

- Although demos use one AI coder, artifacts are command‑friendly for sub‑agents.
- Command chaining shows end‑to‑end automation is possible once trust is high.
- Remote flows (e.g., phone) reuse the same commands; human validation remains required.
- Automations should still expose checkpoints for validation before deployment.

## 19) End‑to‑End Workflow Example (Transcript‑Based)

- Scenario: add folder management tools to the Obsidian agent.
- **Prime:** AI scans repo, README, existing note tools, vault security helpers; summarizes integration points and risks.
- **Vibe Planning:** explore build options (standalone tool vs extension of existing tools); choose standalone; discuss OS handling and safety rules.
- **Structured Plan:** AI writes markdown with goals, success criteria, relevant files, tasks, validation (lint, unit, integration), and security constraints.
- **Execute:** start new chat; load plan; AI edits tool registry, implements create/rename/delete/move folder operations, updates security checks, writes tests; runs lint/type/tests.
- **Human Validate:**
  - Review git diff; ask AI for summaries of changes and security measures.
  - Manual tests in Obsidian: create folder, rename, delete (with confirmation), ensure forbidden paths blocked, verify logs.
- **Commit:** stage and commit feature with descriptive message.
- **System learning:** integration testing friction surfaces; update rules/plan template to test service layer rather than tool registration to improve stability.

## 20) Command Details (Per Transcript)

- **Prime command traits:** list tracked files; scan README and architecture; optional focus flags; human verifies the summary.
- **Plan template/plan‑feature traits:** includes research phases, template sections, line‑count guardrails if needed; outputs to a plans folder.
- **Execute command traits:** insists on thorough plan read; task‑by‑task execution; runs validation steps from the plan; outputs changed files and validation results.
- **Commit command traits:** stages specified files or all; injects git context; confirms commit hash/message.
- **RCA + Implement Fix workflow:** RCA reads issue (e.g., GitHub issue), writes report; Implement Fix consumes RCA report, applies changes, runs validation, summarizes.
- **Code Review + Fix:** review command inspects recent changes; fix command applies issues one by one, then revalidates.
- **System Review:** uses execution report to compare intended vs actual and suggest rule/template updates.
- **Command chaining example:** end‑to‑end feature command runs prime → plan → execute → commit with optional human pause; intended for trusted contexts.

## 21) Context Engineering Pillars (Applied in Planning)

- **Memory:** reuse vibe planning conversation to inform the structured plan.
- **RAG:** pull in external docs, PRD, prior plans, architecture guides, tool guides as on‑demand context.
- **Prompt Structure:** consistent sections for goals, success criteria, references, tasks, validation, risks.
- **Task Management:** explicit, ordered task list to guide AI execution and chunk work.
- Combined effect: minimized assumptions and clearer outputs.

## 22) Handling Existing Codebases (Brownfield)

- Prime focuses on integration points and current architecture.
- Plan identifies files to edit/create, patterns to follow, and constraints from rules.
- Task list should specify target directories and modules to avoid unintended edits.
- Validation must include regression coverage (unit/integration) for touched areas.
- Commit messages should highlight integration points changed.

## 23) Handling New Projects (Greenfield)

- Layer One setup: PRD, rules, architecture decisions, logging/testing standards, command scaffolds.
- Prime may be minimal; focus on selecting stack and conventions with AI.
- Plan should still include validation strategy and starter tests/linting to set standards early.
- Early commits capture baseline so future loops can revert if needed.

## 24) Keeping Plans Concise

- Long plans waste context; set a target line range (the course guidance settled on roughly 500–700 lines).
- If a generated plan is too long, ask AI to condense while keeping all requirements.
- Trim verbose testing or over‑detailed future work; keep only necessary validation steps.

## 25) Validation in Practice (Transcript Notes)

- AI validation often includes lint/type/unit/integration in one run after implementation.
- Human validation includes code review via git diff or AI summaries plus manual feature usage.
- Ask AI to justify security decisions (e.g., path traversal protections) when reviewing.
- Run manual tests mirroring user flows; confirm edge cases (empty names, forbidden paths, confirmations).
- If validation fails badly, revert to plan commit and rerun after adjusting plan/rules.

## 26) System Evolution Loop

- Every failure or friction is a signal to improve commands, rules, templates.
- Examples from transcripts: add line‑count guardrail to plan template; tweak tests to target service layer; refine priming when scans are too shallow.
- System Review command formalizes this: compare plan vs implementation, note divergence causes, propose Layer One/plan updates.
- Update artifacts sparingly but deliberately; keep rules concise to avoid bloat.

## 27) Divergence Analysis (Plan vs Implementation)

- Divergence can be good (better approach discovered) or bad (ignored constraints).
- Capture divergences in execution report; feed into system review.
- If divergence is desired, update rules/templates to reflect new best practice.
- If divergence is harmful, adjust plan template or commands to prevent recurrence.

## 28) Error Handling and Recovery

- If AI damages code, revert to last good commit (post‑plan or post‑validation).
- Split oversized tasks into multiple loops rather than forcing a broken run.
- Use RCA when repeated failures occur; address root causes before retrying.
- Keep tasks atomic so partial progress is easy to roll back.

## 29) Trust Building and Automation

- Start with manual command execution and heavy oversight.
- As consistency grows, introduce command chaining with explicit checkpoints.
- Maintain manual validation even when automating planning and execution.
- Remote/phone workflows should still surface validation results for human approval.

## 30) Practical Heuristics (Rules of Thumb)

- One feature or tool per loop keeps scope safe.
- Always include validation plan in the structured plan; do not rely on defaults.
- Prefer concise code over exhaustive edge‑case handling unless required.
- Use explicit file paths and module names in tasks to steer AI edits.
- When unsure, ask AI to explain its plan before coding; adjust early.
- Keep artifacts organized (plans, reports, rules) for reuse as on‑demand context.

## 31) Manual Testing Ideas (drawn from transcripts)

- For agents: send sample prompts, verify responses, check safety/confirmation flows.
- For file tools: create/rename/delete/move with normal and edge‑case names; verify protections on critical folders; confirm logs.
- For APIs: call new endpoints via curl with valid/invalid payloads; check status codes and side effects.
- Record manual test results to feed into validation reports when useful.

## 32) Security Considerations (from examples)

- Block path traversal and critical folder deletion; enforce safe base paths.
- Require confirmations for destructive actions; allow force flag only when intended.
- Keep logging consistent for auditability.
- Validate inputs (empty names, invalid characters) and bail early when unsafe.
- Document security choices in plan and review summaries.

## 33) Performance and Reliability Notes

- Favor simple, non‑over‑engineered solutions first; avoid unnecessary abstractions.
- Use lint/type/static checks to catch issues before runtime.
- Add tests around new services and agents to prevent regressions as tools grow.
- Watch for AI over‑creating backwards‑compat layers; trim to essentials.

## 34) Managing Context Size

- Separate chats for planning and execution to reset context windows.
- Keep structured plans concise; remove verbose prose and redundant sections.
- Use on‑demand context rather than always‑on to save tokens.
- Split work into multiple loops if context approaches limits.

## 35) Artifacts and Storage

- Plans: stored as markdown; organized in a plans folder.
- Reports: RCA, code review, system review stored in a reviews folder for reuse.
- Rules and PRD: Layer One; rarely changed; kept concise.
- Commits: primary source of truth for state between loops.
- Consider keeping dot‑agents artifacts out of VCS if not needed; add to when appropriate.

## 36) Example Plan Sections (template cues)

- Feature description and problem statement.
- User story and success criteria.
- Context references (rules, PRD sections, docs, prior plans).
- Relevant files and integration points to touch.
- Implementation tasks (ordered, granular).
- Validation strategy (pyramid levels, commands to run).
- Risks, open questions, and assumptions.
- Future enhancements or out‑of‑scope items (kept brief).

## 37) Example Execute Instructions (template cues)

- Read the entire plan before editing.
- Work task‑by‑task; do not skip.
- After each task, run quick checks (imports, lint where cheap).
- After all tasks, run full validation plan.
- Summarize files changed, tests run, and outcomes.
- Surface uncertainties instead of guessing.

## 38) Example Validation Checklist (template cues)

- Lint/style pass.
- Type check pass.
- Unit tests relevant to touched modules.
- Integration/end‑to‑end tests for the new flow.
- Manual checks: describe steps and expected results.
- Record failures and reruns until clean.

## 39) Using Git with the PIV Loop

- Create commits after stable milestones: post‑plan (optional) and post‑validation (required).
- Use diffs for code review and system review inputs.
- Revert to prior commit when implementation goes off the rails.
- Keep commit messages descriptive (feature, validations run, notable decisions).

## 40) When to Split a Loop

- Plan grows too long or complex.
- Validation requires many environments or datasets.
- AI repeatedly fails to complete tasks in one pass.
- Stakeholders want staged delivery (e.g., connect agent first, add tools later).
- Splitting reduces risk and clarifies success criteria per slice.

## 41) When to Chain Commands

- After multiple clean iterations with similar work where risk is low.
- When human checkpoints are lightweight and well‑placed (e.g., before commit).
- When artifacts are standardized (plan template, validation commands).
- Avoid chaining for novel architectures or high‑risk changes.

## 42) Sample RCA Flow (transcript pattern)

- Trigger: failing test or bug report.
- Run RCA command with issue description/ID.
- RCA reads code and context; outputs causes, impacted areas, and fix plan.
- Implement Fix command consumes RCA report; applies changes; runs validation pyramid.
- Commit after successful validation; document what changed.

## 43) Sample Code Review Flow

- Run Code Review command after implementation (before final commit when possible).
- Command inspects changed files, looking for logic, security, performance, style issues.
- Outputs structured report (issues by severity, files, recommendations).
- Code Review Fix command applies selected fixes; reruns validation; reports results.
- Human can accept/override recommendations; update rules/templates if patterns recur.

## 44) Sample System Review Flow

- Prerequisite: execution report generated right after implementation context ends.
- System Review compares structured plan vs execution report vs diffs.
- Identifies divergences (ignored constraints, extra changes, plan misfits).
- Suggests updates to rules, templates, or commands to prevent repeats.
- Human evaluates suggestions, applies accepted changes, commits updates to Layer One artifacts.

## 45) Manual Review Prompts (helpers)

- “Explain why you changed X and what alternatives you considered.”
- “List new environment variables or config flags introduced.”
- “What security checks guard this feature?”
- “Which files should I inspect to understand the change?”
- “Summarize test coverage added and remaining gaps.”

## 46) Signs the System is Improving

- Plans are shorter yet sufficient; fewer clarifying questions.
- AI completes loops with fewer human interventions.
- Validation failures shift from structural (missing tests) to minor (typos, edge cases).
- Divergence rates drop; system review recommendations shrink.
- Command chaining requires fewer manual pauses.

## 47) Signs the System Needs Attention

- Plans routinely exceed context limits or feel bloated.
- AI skips tasks or validations despite instructions.
- Frequent architectural drift or security regressions.
- Manual testing discovers issues not caught by plan validations.
- Repeated failures on similar tasks; triggers RCA/system review.

## 48) Remote and Future Automations (course outlook)

- Same PIV artifacts power remote execution (e.g., run commands from phone/Slack).
- Workflow still respects Plan/Validate ownership by humans.
- Automations should surface validation reports for approval before merging/deploying.
- Multi‑agent setups reuse the plan and reports as shared contracts.

## 49) Summary Cheat Sheet

- Prime → Vibe Plan → Structured Plan → Execute → Validate → Commit → Iterate.
- Keep loops small; include validation in the plan; review outputs; commit after success.
- Evolve rules/templates/commands whenever friction or failure is observed.
- Use artifacts as on‑demand context to speed future loops and reduce assumptions.

## 50) Glossary (Plain English)

- **PIV Loop:** Plan → Implement → Validate cycle; repeatable for any feature.
- **Prime:** Pre‑plan context loading step.
- **Vibe Planning:** Informal exploration with AI to clarify goals/options.
- **Structured Plan:** Formal markdown with tasks, validation, references.
- **Layer One Planning:** Project‑level rules, architecture, PRD, commands; rarely updated.
- **Layer Two Planning:** Per‑feature planning that feeds each loop.
- **Context Engineering:** Using memory, RAG, prompt structure, task management to give AI complete context.
- **Execute Command:** Implements the plan, runs validations, reports changes.
- **Validation Pyramid:** Five‑level check: style, types, unit, integration, human review.
- **Commit Command:** Save point after validation.
- **RCA:** Root Cause Analysis; diagnoses and plans a fix.
- **Implement Fix:** Executes the RCA plan and revalidates.
- **Code Review Command:** Automated review of recent changes.
- **System Review:** Command that compares plan vs implementation to improve the system.
- **Command Chaining:** Running multiple commands in sequence automatically.
- **On‑Demand Context:** Only load references when needed to save context.
- **Vertical Slice:** Feature‑oriented architecture slice used as a planning reference.
- **Trust but verify:** Human monitors AI lightly during execution and reviews results fully.

## 51) Quick Start (Minimal Checklist)

- Run **Prime** to load context.
- Hold a short **Vibe Planning** chat; note decisions.
- Generate **Structured Plan** with validation embedded.
- New chat → **Execute** plan task‑by‑task; let AI run planned checks.
- Perform **Human Validation** (review + manual test); rerun checks after fixes.
- **Commit** validated work; log lessons for future loops.
