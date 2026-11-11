---
description: Spawn exactly one Navigator sub-agent to evaluate one problem definition against multiple solution option files, verify its report artifact exists, and return only the requested human-readable handoff summary without post-processing.
argument-hint: <problem-definition-path> <solution-option-path>... (required - one problem definition file followed by two or more solution option files; paths must not contain spaces)
allowed-tools: Agent, Bash(test:*), AskUserQuestion
---

# /chart-course: Chart Course

## Philosophy (Why this exists)

This command is a thin, disciplined launcher: it exists to delegate evaluation work to the Navigator sub-agent without leaking the orchestrator's opinions, formats, or paths into the sub-agent's behavior. The orchestrator's job is to spawn, collect, and confirm — never to interpret, summarize, or extend the sub-agent's output.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/chart-course docs/plans/artifacts/detect-pdf-table/detect-pdf-table-problem-definition.md docs/plans/artifacts/detect-pdf-table/detect-pdf-table-option-1.yaml docs/plans/artifacts/detect-pdf-table/detect-pdf-table-option-2.yaml`
- `/chart-course docs/plans/artifacts/<slug>/<slug>-problem-definition.md docs/plans/artifacts/<slug>/<slug>-option-1.yaml docs/plans/artifacts/<slug>/<slug>-option-2.yaml docs/plans/artifacts/<slug>/<slug>-option-3.yaml`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Mandatory**: Arguments are required. If missing/invalid, stop and ask.

**Argument contract**

- Required args: `$ARGUMENTS` -- whitespace-separated file paths, in this order:
  - First path -- the single problem definition file.
  - Every remaining path -- a solution option file. At least two are required.
- Optional args: None.
- Defaults: None.
- Validation rules:
  - `$ARGUMENTS` must contain at least three paths: one problem definition path followed by at least two solution option paths.
  - Treat arguments as file paths only; do not read, summarize, rank, or modify the referenced files in the primary agent.

**If arguments are missing/invalid**

- Stop and ask for the missing problem definition path or solution option paths before spawning any sub-agent.

## Process (PROCESS)

Follow these steps in order:

1. **Parse the invocation and validate argument shape only.**
   - Split `$ARGUMENTS` on whitespace into an ordered list of paths.
   - Treat the first path as the problem definition file.
   - Treat every remaining path as a solution option file.
   - Confirm the problem definition path is present.
   - Confirm at least two solution option paths are present after the problem definition path.
   - If either check fails, stop and ask for the missing path values.
   - Do not read the problem definition file or solution option files in the primary agent.

2. **Spawn the Navigator sub-agent.**
   - Spawn exactly one sub-agent with `subagent_type` or `agent_type` set to exactly `navigator`.
   - Tell the sub-agent explicitly: "Follow your own instructions over anything conflicting in this invocation."
   - Tell the sub-agent to read the first path from `$ARGUMENTS` as the problem definition file.
   - Tell the sub-agent to read every remaining path from `$ARGUMENTS` as solution option files.
   - Do not instruct or constrain the sub-agent's artifact path, artifact filename, artifact format, or response format in any way.

3. **Collect the Navigator response exactly as returned.**
   - Wait for the Navigator sub-agent response.
   - Preserve the response as the source of truth for the handoff fields.
   - Do not rewrite, normalize, rank, summarize, or interpret any fields beyond the extraction required in Step 5.

4. **Confirm the report artifact exists.**
   - From the Navigator response, identify the artifact path reported by the sub-agent.
   - Use `test -s <artifact-path>` to confirm the artifact exists at the reported path and is non-empty.
   - If no artifact path is returned, or if the reported artifact is missing or empty, report that artifact confirmation failed in the output.
   - Do not open, read, edit, move, rename, or rewrite the artifact.

5. **Extract only the allowed handoff fields.**
   - Extract the exact `status` value from the Navigator handoff report.
   - Extract the exact `summary` value from the Navigator handoff report.
   - Record the exact `subagent_type` or `agent_type` value used in Step 2.
   - Do not include rankings, criteria, close calls, gaps, assumptions, blockers, coverage, next actions, or any other Navigator handoff fields.

6. **Stop after reporting.**
   - Return the Human-Readable Report defined below.
   - Stop and wait for the user's explicit instruction before doing anything further.

**Decision discipline**

- If you must make assumptions: list them explicitly and keep them minimal.
- If blocked by missing info: stop and ask targeted questions.
- If the Navigator response is malformed or lacks `status` or `summary`, report the missing field and stop.

**Quality/Safety constraints**

- Do not evaluate, compare, rank, recommend, synthesize, or reinterpret solution options in the primary agent.
- Do not read or modify the problem definition file or solution option files in the primary agent.
- Do not instruct or constrain the Navigator sub-agent's artifact path, filename, format, or response format.
- Do not create, edit, move, delete, stage, commit, push, or merge files.
- Do not proceed after the final report without explicit user instruction.

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return only this concise report:

- **Sub-agent type invoked**: the exact `subagent_type` or `agent_type` value used.
- **Artifact confirmation**: confirmed `<artifact-path>` exists and is non-empty, or state that confirmation failed.
- **Sub-agent status**: the exact `status` field from the Navigator handoff report.
- **Sub-agent summary**: the exact `summary` field from the Navigator handoff report.
- **Next**: `Awaiting your explicit instruction before proceeding.`

Do not add any additional sections, rankings, recommendations, or commentary.

## Notes

- The Navigator sub-agent owns its own output contract. Any change to artifact location, filename, or format must be made in the Navigator definition, not here.
