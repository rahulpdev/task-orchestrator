---
description: Think through a decision the way a senior software engineer would, assess every option against seven explicit lenses, then return a recommendation with the relevant trade-offs to support the technically-inexperienced project owner's final decision.
argument-hint: [guidance] (optional - extra context, constraints, concerns, leanings, confusions, or focus instructions)
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(ls:*), Bash(find:*), Bash(cat:*), WebFetch, WebSearch, AskUserQuestion
---

# /wwcd: Consider a Decision Like a Senior Engineer

## Philosophy (Why this exists)

In long agent-driven sessions the user (the project owner) is handed technical choices that outrun their experience, and making a decision in the moment risks committing to a black-box "do X". This command is the pause-and-think alternative: it closes the gap by considering the decision the way a senior software engineer would, surfacing the decision-making judgement, and making every assumption visible so the user can keep ownership of the final choice.

## Invocation & Arguments (INPUT)

**Usage examples**

- `/wwcd`
- `/wwcd This is for the v1 launch, single-region only, no payments yet.`
- `/wwcd Also research current best practices for background job processing in Python online before recommending.`

**Arguments received**

- All args as a single string: `$ARGUMENTS`

**Arguments policy**

- **Optional**: `$ARGUMENTS` may be omitted. When omitted, the target decision is taken from the AI agent's immediately preceding response.

**Argument contract**

- Required args: None
- Optional args: `$ARGUMENTS` = free-form additional context or explicit guidance.
- Defaults: Empty string. Target decision is in the AI agent's immediately preceding response.
- Validation rules: None on `$ARGUMENTS`.

**If arguments are missing/invalid**

- If `$ARGUMENTS` is empty AND the AI agent's preceding response does not contain a decision the user is being asked to make, stop and ask: "Which decision would you like me to think through?" Do not proceed.

## Context to Load (INPUT)

**Standing user context**

- The user is a beginner-to-intermediate software engineer.
- The user is building applications intended to become cloud-deployed, income-generating SaaS products.
- The user wants to remain the final owner of every material decision.
- The user needs the AI agent to supply the experienced engineering judgement they have not yet built through years of shipping, maintaining, scaling, and repairing production applications.

## Process (PROCESS)

Follow these steps in order:

1. **Resolve the target decision and separate it from the user's intent.**
   - If `$ARGUMENTS` itself describes a decision to evaluate, treat that as the target decision.
   - Otherwise, the target decision is the one presented in the AI agent's immediately preceding response in this conversation.
   - Treat any remaining content in `$ARGUMENTS` — confusion, concern, leaning, constraint, or focus instruction — as the user's intent for this pass, not as the decision itself, and use it to weight which lenses get the most attention.
   - If neither `$ARGUMENTS` nor the preceding response contains a decision to make, stop and ask the user which decision to think through. Do not proceed.

2. **Pre-lens check A — Decision necessity.**
   - State whether the decision needs to be made now, or whether it can be deferred (YAGNI / premature optimisation).
   - If it can be deferred, state explicitly what to do instead (e.g., "ship the simplest thing that works; revisit when [trigger]") and continue to the lens analysis only if the user is likely to still want a view.

3. **Pre-lens check B — One-way vs two-way door.**
   - Classify the decision as **one-way** (hard or costly to reverse — depth of analysis must be high) or **two-way** (cheap to reverse — decide and move on).
   - Use this classification to calibrate how exhaustive the lens analysis below needs to be. State the classification explicitly in the output.

4. **Identify the options on the table.**
   - List every option the AI agent presented, with a one-line plain-language summary of what each actually means.
   - If the agent presented a false binary or missed an obviously viable alternative, name the additional option(s) and mark them as "added by wwcd".

5. **Gather repository context only as needed.**
   - For each lens below, decide whether it needs evidence from the codebase to evaluate properly.
   - Read only the minimum necessary files (e.g., PRD, TAD, `CLAUDE.md`, architecture docs, top-level configs, dependency manifests, key source files implicated by the decision).
   - Do not boil the ocean; do not load files unrelated to the lens being evaluated.

6. **Evaluate every option against all seven lenses.**
   - For each option, score and briefly justify (one or two sentences per lens):
     1. **Modern best practices & common standards** — is this what a current, well-run team would do?
     2. **Architectural consistency** — does this fit the project's existing architecture and system design as evidenced in the repo?
     3. **Lock-in & reversibility** — how easy is it to back out of this later, and what would the un-doing cost?
     4. **Lifecycle-appropriate (present + future)** — does this match where the application and business actually are today, while not closing off plausible future needs?
     5. **On-call & maintenance burden** — how much ongoing care does this need from _anyone_ maintaining it (monitoring, upgrades, patching, recurring fixes)?
     6. **Maintainability by the user specifically** — can the user, given their stated solo + intermediate skill context, realistically debug, extend, and operate this when it breaks?
     7. **Security, privacy, compliance, failure modes & observability posture** — what's the worst-case failure, who's exposed, what regulations apply, and can you see what it's doing in production?
   - If a lens genuinely does not apply to this decision, say "N/A" with one sentence of why.

7. **Pick the recommendation and up to two runners-up.**
   - Choose exactly one option as the recommendation.
   - Choose zero, one, or two runners-up — only options that are genuinely close on the merits. Do not pad to two.
   - Do not include obviously inferior options as runners-up.
   - Assign a confidence level to the recommendation — **High**, **Medium**, or **Low** — based on how strongly the lens evaluations converge and how many unconfirmed assumptions the recommendation depends on.

8. **Make the judgement explicit.**
   - State the prioritisation that produced the recommendation in one or two plain sentences, in this shape: _"I weighted [lens or factor] over [lens or factor] because [assumption about the user's stage, goals, or risk tolerance]. If you'd weight [the latter] higher, the recommendation flips to [option]."_
   - For each runner-up, write a single line: _"Stronger than the recommendation on [lens(es)]; lost because I weighted [lens] more, given [assumption]. Would win if [specific condition]."_

9. **Surface what the user should ask or challenge.**
   - List 2-5 specific questions the user might want to put back to the AI agent before committing (e.g., to test an assumption, get a missing number, or push on a constraint).
   - List any assumptions the user is best placed to confirm or override.

10. **Render the output using the OUTPUT section below.**

**Decision discipline**

- If a lens is unclear because evidence is missing from the repo, say what evidence would resolve it rather than guessing.
- If the recommendation depends on an assumption the user has not confirmed, name the assumption — do not bury it.
- If your decision is conditional, immediately name what it depends on and commit to the default under the most likely conditions; do not hedge and stop.
- Prefer the lightest viable option for the current lifecycle stage; resist over-engineering on speculative future needs.
- If genuinely undecidable without more input from the user, stop and ask one targeted question rather than recommending blindly.

**Quality/Safety constraints**

- Do not invent options the AI agent did not present unless they are obviously viable and clearly labelled as added by this command.
- Do not present any repository fact as known unless it has been verified by reading the relevant file in this session; if the file was not read, say what evidence is missing instead.
- Do not modify any files. This command is read-only.
- Do not soften, hedge, or hide the prioritisation behind generic trade-off language — the judgement section must name the lever pulled.
- Do not skip a lens silently. Either evaluate it or mark it "N/A" with one sentence of reasoning.

## Output (OUTPUT)

### Human-Readable Report (for humans)

Return a single decision brief in the structure below. Use plain language; assume the reader is technically intermediate and may not know every term the AI agent used.

```markdown
# Decision Brief

## The decision

<one-paragraph plain-language restatement of what is actually being decided>

## Pre-checks

- **Needs to be decided now?** <Yes / No — with one-line reason. If No, state what to do instead.>
- **Door type:** <One-way / Two-way> — <one-line implication for how much weight to put on this>

## Options on the table

1. **<option name>** — <one-line plain summary>
2. **<option name>** — <one-line plain summary>
3. **<option name>** — <one-line plain summary>

<(mark any option you added with "added by wwcd")>

## Lens-by-lens evaluation

<For each option, a compact block:>

### <Option name>

- Best practices & standards: <score or short verdict> — <one sentence>
- Architectural consistency: <...>
- Lock-in & reversibility: <...>
- Lifecycle-appropriate: <...>
- On-call & maintenance burden: <...>
- Maintainability by you specifically: <...>
- Security / compliance / failure / observability: <...>

## Recommendation: <option name>

<one short paragraph on why this option wins overall>

**Confidence:** `High` | `Medium` | `Low` — <one-line reason for the confidence level>

### Judgement applied

I weighted **<lens / factor>** over **<lens / factor>** because **<assumption about the user's stage, goals, or risk tolerance>**. If you'd weight **<the latter>** higher, the recommendation flips to **<option>**.

### Runners-up

<Zero, one, or two entries. Omit this whole subsection if there are none.>

1. **<option name>** — Stronger than the recommendation on <lens(es)>; lost because I weighted <lens> more, given <assumption>. Would win if <specific condition>.
2. **<option name>** — <same shape>

## Questions worth putting back to the agent

1. <specific question that would test an assumption or fill a gap>
2. <...>
3. <...>

## Assumptions you are best placed to confirm or override

- <assumption 1>
- <assumption 2>
```

Do not add a status line, preamble, or closing offer outside this structure.

**If you cannot responsibly produce the brief**, return only this shorter blocked template instead — never half-fill the main template:

```markdown
# Decision Brief: Blocked

**Why:** <what is missing or unclear that prevents responsible analysis>

**Question:** <one targeted clarifying question the user must answer before this command can proceed>
```

## Notes

- The judgement section is the most important part of the output. If a future maintainer is tempted to remove or soften it, do not — it is the entire reason this command exists.
