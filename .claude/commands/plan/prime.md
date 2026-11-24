---
description: Load the project's documents and code into context before planning or implementation, save a report of the project's current state, then have the document-reviewer sub-agent read the report and correct its wording
argument-hint: "[feature focus] (optional - a feature to study closely)"
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, Bash(mkdir:*), Bash(date:*), Bash(git ls-files:*), Bash(git log:*), Bash(git status:*), Bash(tree:*), Bash(find:*), Bash(ls:*)
---

# Prime: Load Codebase Context

## Purpose

Build a complete mental model of this project before any planning or implementation work. After priming, you should be able to answer: what exists, what's planned, what's built, key interactions, what's next, which implementation and planning-readiness findings are directly evidenced versus inferred, and what is still unknown.

This command names no project, folder or framework. Take every such fact from the project itself: its `CLAUDE.md`, its `README.md`, its planning documents and its files. Use the project's own names for its parts.

## Input

Feature focus (optional): $ARGUMENTS

(If a feature is specified, pay extra attention to related sections in the PRD/TAD and any existing components that interact with it.)

## Process

### 1. Snapshot Current Project State

Get a quick overview of how the files are laid out, and of recent work, before reading in more detail:

All files kept in git:
!`git ls-files`

Directory structure (3 levels deep):
!`tree -L 3 -I 'node_modules|__pycache__|.git|dist|build|.venv|worktrees'`

Recent development activity:
!`git log -10 --oneline`

Uncommitted changes:
!`git status`

### 2. Load Project Requirements and Architecture

Read these documents in full, where they exist:

- @docs/PRD.md, the PRD (product requirements document)
- @docs/TAD.md, the TAD (technical architecture document)
- `README.md` at the project root

If the PRD or the TAD is not at that path, look for the project's requirements and architecture documents under another name, starting from the root `README.md`. Record under **Missing evidence** any you could not find.

### 3. Read Project Configuration and Entry Points

- Read the configuration files that state the project's dependencies, versions and tool settings (for example `pyproject.toml`, `package.json`, `tsconfig.json`, `Package.swift`, `manifest.json`).
- Read the main entry points, the files the application starts running from, to understand how the application is wired together. Find them from the architecture section of `CLAUDE.md`, the TAD and the configuration files.
- Read the foundational definitions that every component builds on: the shared definitions of what each kind of record holds, the shared error types, and the code that connects to wherever the project keeps its data.

Never open a file that holds secrets, such as `.env`. An example file, such as `.env.example`, is safe to read.

**Skip `.claude/` folder, all `.agents/` subfolders (except `.agents/examples`), and the `docs/options/` and `docs/reviews/` folders**.

### 4. Map Current Implementation State

A component is one part of the system as the project's own documents divide it, such as a feature slice, a package, a module or a build target. Take the list of components from the architecture section of `CLAUDE.md` and from the TAD, then check it against the folders. Where the documents and the folders disagree, report both.

- **Shared code**: which modules serve every component, what does each provide, and which entry points or components depend on it?
- **Each component**: which of the files the architecture prescribes for a component does it have, including its tests? Note its primary entry points, what it depends on, where it reads or writes stored data, which outside services it calls, and how it interacts with other components.
- **Tests that cross components**: what coverage exists above the level of one component, and which flows from an entry point through to stored data or an outside service are exercised?

### 5. Review Stored Data

Work out whether the project keeps data between runs, and where: a database, files it writes, or storage the host application provides.

If it does, find where the structure of that data is defined, such as migration files (the scripts that create or change database tables), schema files or record definitions in the code. Read them to understand what is in place and which rules apply to it.

If it keeps no data between runs, say so in the report.

### 6. Identify Implementation Gaps and Unknowns

Cross-reference the PRD feature list and TAD component architecture against the actual codebase to determine:

- Which features are **Built** (code and tests, plus any stored-data definitions the feature needs)
- Which features are **Partial** (some files exist)
- Which features are **Not started** (no files yet)
- Any **open decisions** listed in the TAD that affect planning

For each feature implementation-status or planning-readiness finding, label whether it is **Observed**, **Inferred**, or **Unknown**. If the codebase or docs do not provide enough evidence, say exactly what is missing and capture the unknowns that must be resolved before planning.

If a specific feature was provided in `$ARGUMENTS`, deep-dive into:

- The PRD section for that feature (requirements, interface contracts, acceptance criteria)
- The TAD section (component design, data model, interface contracts)
- Any existing code that the feature depends on or interacts with

### 7. Save the Report

Write the report, in the Output Report format below, to `docs/reviews/prime-<YYYY-MM-DD-HHMMSS>.md`. Take the time from `date '+%Y-%m-%d-%H%M%S'`, and create the `docs/reviews/` folder if it does not exist.

### 8. Run the Document Review

Start the `document-reviewer` sub-agent once and pass it two paths and nothing else: the communication standard at `.agents/reference/communication-standard.md` and the report saved in step 7. Follow the instruction that closes its response, using Edit on the report file only.

Correct wording only. Do not change a status, an **Observed**, **Inferred** or **Unknown** label, or a fact, and ignore any finding against a heading or field name the Output Report format fixes. If the sub-agent cannot be started, or reports that it is blocked, leave the report as saved and say so.

## Output Report

Save a concise summary covering the headings below. Then return only the path to the saved file and what the document-reviewer's closing instruction says to tell the user, or that the review did not run. Do not repeat the report.

The saved file contains only the parts below, and the Feature Focus part only when a feature is specified. Explain a term inside the part where it first appears.

### Project Context

**Project:** [name, from the root `README.md` or the configuration files]
**Purpose:** [1-sentence summary]
**Reported:** [date and time of this report]

### Current Development State

- **Active branch:** [branch name]
- **Uncommitted changes:** [none, or a list of them]
- **Recent focus:** [summary of last 10 commits: what area is being actively developed]

### Key Decisions

- **Product goals:** [key objectives and constraints]
- **Architecture decisions:** [major trade-offs and why they were made]
- **Scope boundaries:** [what the project explicitly will NOT do]

### Architecture Overview

| Component        | Status                          | What exists           | Tests                 |
| ---------------- | ------------------------------- | --------------------- | --------------------- |
| Shared code      | [Built / Partial / Not started] | [list modules]        | [what is covered]     |
| [Each component] | [Built / Partial / Not started] | [list existing files] | [what is covered]     |

### Feature Status

- **Built:** [features from the PRD that are built]
- **Partial:** [features with some files in place, and what each still lacks]
- **Not started:** [features with no files yet]

### System Interaction Map

- **What starts the application's work:** [for example web addresses that receive requests, scheduled jobs, commands typed in a terminal, or actions a person takes in a host application]
- **Shared code:** [modules that serve every component and what they provide]
- **Major components:** [main components and their responsibilities]
- **Where the system keeps data between runs:** [each database, file or host-provided store, and the code that reads and writes it]
- **Outside services:** [each service the system calls and what it reads from or writes to it]
- **Dependencies between components:** [important component-to-component or layer-to-layer interactions]
- **What the feature focus depends on:** [if specified, components that must exist first]

### Tech Stack

- **Languages and versions:** [e.g. Python 3.12, TypeScript 5.9, Swift 6]
- **Frameworks and major libraries:** [e.g. FastAPI, the Obsidian plugin API, SwiftUI]
- **Build tools and package managers:** [e.g. uv, pnpm, Xcode]
- **Testing frameworks:** [e.g. pytest, Vitest, XCTest]

### Stored Data

- **Where its structure is defined:** [the migration files, schema files or record definitions found, with a count]
- **What is defined:** [the tables, files or kinds of record]
- **Notable rules:** [access rules, indexes, limits]

If the project keeps no data between runs, write "None" under this heading.

### Core Principles

- **Code style:** [key style and conventions observed]
- **Documentation:** [standards that apply]
- **Testing:** [approach and what's currently covered]

### Watch List

- **Observations:** [anything surprising, inconsistent, or worth flagging]
- **Risks or blockers:** [open decisions, missing dependencies, anything that could stall progress]

### Unknowns to Resolve Before Planning

- **Open questions:** [ambiguities or missing decisions that must be resolved before planning]
- **Unsafe assumptions:** [assumptions that should not be relied on without validation]
- **Missing evidence:** [docs, code, stored-data definitions, or tests that were expected but not found]

### Feature Focus (if specified)

- **Feature:** [name from PRD]
- **PRD requirements:** [key points]
- **TAD design:** [key points]
- **Dependencies:** [what must exist first]
- **Existing code to build on:** [relevant components]
