---
description: Spawn multiple pathfinder sub-agents in parallel to independently generate diverse solution options for a given problem definition, save each YAML report to disk, and return the saved paths without synthesis or interpretation.
argument-hint: <problem-definition-path> (required - path to the problem definition file)
allowed-tools: Read, Agent, Bash, Write
---

# /plot-routes: Parallel Pathfinder Route Plotting

## Philosophy (Why this exists)

Diverse solutions emerge when independent thinkers work the same problem without influencing each other. This command enforces that by dispatching the same problem definition to multiple pathfinder agents in parallel, saving each sub-agent's raw YAML report to disk, and returning only where each report was saved -- the orchestrating agent must never filter, rank, merge, or interpret the results.

The definition file is the only channel through which constraints reach the sub-agents. Anything they must honour lives in that file, never in the prompt, so every later reader of the options sees exactly what their authors saw.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/plot-routes docs/options/auth-redesign-problem-definition.md`
- `/plot-routes docs/options/<slug>-problem-definition.md`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Mandatory**: Arguments are required. If missing/invalid, stop and ask.

**Argument contract**

- Required args: `$ARGUMENTS` -- file path to a problem definition
- Optional args: None
- Defaults: None
- Validation rules: `$ARGUMENTS` must be an existing file path; verify with `Read` before proceeding

**If arguments are missing/invalid**

- Stop and ask for the file path to the problem definition. Do not proceed without it.

## Context to Load (INPUT)

**Read these files (auto-load into context)**

- @$ARGUMENTS (the problem definition file -- validate it exists before spawning sub-agents)

## Process (PROCESS)

Follow these steps in order:

1. **Validate the problem definition file.**
   - Read the file at `$ARGUMENTS`.
   - If the file does not exist or is empty, stop and report the error. Do not proceed.
   - If the file lacks a `Settled decisions and constraints` section or a `Reference files` section, stop and report; the sub-agents would otherwise design against an incomplete definition.
   - Take `<dir>` and `<slug>` from `$ARGUMENTS` as the Saved File section's naming rule sets out. If the folder does not exist, or the filename does not end in `-problem-definition.md`, stop and report.
   - Apply the Saved File section's rule for files that already exist before spawning any sub-agent.
   - If the file exists and is complete, note its path for the sub-agent prompts.

2. **Spawn N pathfinder sub-agents in parallel, where N is 3 to 5.**
   - Use the Agent spawning tool with `subagent_type|agent_type: "pathfinder"` for each.
   - All sub-agents must be dispatched in a single message (parallel invocation).
   - Each sub-agent receives the same prompt containing:
     - An instruction to thoughtfully consider, comprehensively research, and creatively ideate, with priority over speed or task completion.
     - The file path from `$ARGUMENTS` with an instruction to read it as the problem definition.
     - An instruction to read every file listed in the definition's `Reference files` section, by the path given there, and to treat that list as replacing any default project files the sub-agent's own instructions name. A file the definition does not list is not required.
     - An instruction to treat every item in the definition's `Settled decisions and constraints` section as binding: the solution must comply with each one, and a sub-agent that believes a settled decision is wrong records the conflict in its report rather than designing around it.
     - An instruction to date any repository history from git rather than file timestamps, to cite the source file for any pattern or example it quotes, and to state where its solution departs from a guide whose name or pattern it adopts.
     - An instruction to check, before returning, that every step in its implementation outline is consistent with its own scope and completion claims, and to resolve or name any contradiction.

3. **Save each sub-agent's YAML report as the Saved File section describes.**
   - For each sub-agent response, numbered in the order received (1 to N):
     - Extract the YAML report block from the sub-agent's response.
     - Write it to the path the Saved File section gives, where `<i>` is the sub-agent's sequential number.

4. **Return the final response as the Output section describes.**
   - Wait until all YAML reports from step 3 have been saved before responding.
   - After responding, stop.

**Decision discipline**

- Do not add interpretation, synthesis, comparison, filtering, evaluation, recommendation, summary, conclusion, prioritisation, or decision-making to the sub-agent output.
- Do not merge, reconcile, collapse, or extract "common themes," "divergence points," or "next decisions."
- Treat each sub-agent's response as a deliverable to the user, not as input for your own analysis.
- Do not add facts, context, or constraints to the sub-agent prompt that are not in the definition file. If something is missing, stop and have the definition amended first.

**Quality/Safety constraints**

- Do not modify any files outside the problem-definition's folder (`dirname($ARGUMENTS)`).
- Do not proceed past step 4. After responding, stop and wait for the user's explicit instruction.

## Saved File (OUTPUT)

- **Path**: `<dir>/<slug>-option-<i>.yaml`, one file for each sub-agent
- **Naming rule**: `<dir>` is the folder of the problem definition, `dirname($ARGUMENTS)`. `<slug>` is the problem definition's filename, `basename($ARGUMENTS)`, with the `-problem-definition.md` ending removed; the filename is the canonical source of truth for the slug. `<i>` is the sub-agent's number in the order its response was received (1 to N).
- **Written for**: a later command.
- **If the file already exists**: If any `<slug>-option-<i>.yaml` file is already in `<dir>`, stop and ask before overwriting any of them.

**Layout**

The YAML report block from the sub-agent's response, saved unchanged.

## Output (OUTPUT)

### Human-Readable Report (for humans)

Present the following, and repeat nothing that is in the files:

- **Heading**: `# Parallel Pathfinder Results for $ARGUMENTS`
- **Status**: `Success`, or `Blocked` with the reason if a file could not be written.
- **Sub-agent count**: `<N>` (as defined in step 2)
- **Sub-agent type**: `subagent_type|agent_type` that was invoked
- **Files**: the path of each saved option file, one per line
- **Footer**: "Awaiting your instruction before proceeding."

Do not add any additional sections, summaries, comparisons, or recommendations.
