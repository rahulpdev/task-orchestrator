# Codex Sub-Agents — Reference

## Badges

![Docs](https://img.shields.io/badge/docs-reference-informational)
![Format](https://img.shields.io/badge/format-toml-blue)
![Focus](https://img.shields.io/badge/focus-sub%20agents-5b3cc4)

## Overview

This folder holds the Codex form of the three sub-agents defined in `.claude/agents/`. Each TOML file is generated from its Markdown counterpart by `scripts/claude_to_codex_subagent_converter.py`: the name and description are copied, the Markdown body becomes `developer_instructions`, and the Claude model tier and effort are translated through the script's mapping tables. The files are never edited by hand; after a change to a Claude sub-agent, the Codex file is regenerated and the tests in `scripts/tests/` confirm the two agree. The folder installs into a project as `.codex/`. Codex has no slash commands, so the commands in `.claude/commands/` and the skills in `.claude/skills/` are run there by asking Codex to read and follow the file in full.

## Key Features

- One source of truth: every file here is derived from `.claude/agents/`
- A test that fails if any file here differs from what the converter produces
- Model and effort mappings kept in one place, in the converter

## Documents

Each item below is a sub-agent definition in `agents/`. The behaviour of each is described in [`.claude/agents/README.md`](../.claude/agents/README.md).

- [`agents/document-reviewer.toml`](agents/document-reviewer.toml): **Document Reviewer** — generated from `.claude/agents/document-reviewer.md`; model `gpt-5.3-codex`, effort `high`.
- [`agents/navigator.toml`](agents/navigator.toml): **Navigator** — generated from `.claude/agents/navigator.md`; model `gpt-5.4`, effort `high`.
- [`agents/pathfinder.toml`](agents/pathfinder.toml): **Pathfinder** — generated from `.claude/agents/pathfinder.md`; model `gpt-5.4`, effort `xhigh`.

## Maintenance

When a Claude sub-agent changes:

- Regenerate its Codex file: `python scripts/claude_to_codex_subagent_converter.py .claude/agents/<name>.md -o .codex/agents/<name>.toml --overwrite`.
- Run `python -m unittest discover -s scripts/tests`; the regeneration test must pass.
- When Codex model names change, update the mapping tables in the converter first, then regenerate all three files and update the model names listed here.
- Keep this README list in sync with the files in `agents/`.
