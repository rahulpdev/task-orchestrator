# Personal Task Orchestrator

> Capture everything in your life in one place, organise it, set priorities and make commitments, then focus on getting stuff done in short bursts and run regular reviews.

![TypeScript](https://img.shields.io/badge/typescript-5.9-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/node-26-5FA04E?logo=nodedotjs&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-12-F69220?logo=pnpm&logoColor=white)
![Obsidian](https://img.shields.io/badge/obsidian-1.15.0%2B-7C3AED?logo=obsidian&logoColor=white)
![Vitest](https://img.shields.io/badge/vitest-5-6E9F18?logo=vitest&logoColor=white)
![License](https://img.shields.io/badge/license-Elastic--2.0-lightgrey)

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Getting Started](#getting-started)
5. [Running the Plugin](#running-the-plugin)
6. [API Reference](#api-reference)
7. [CLI Usage](#cli-usage)
8. [Testing](#testing)
9. [Configuration](#configuration)
10. [Disclosures](#disclosures)
11. [FAQs](#faqs)
12. [Contributing](#contributing)
13. [License](#license)

---

## Overview

Capture everything in your life in one place, organise it, set priorities and make commitments, then focus on getting stuff done in short bursts and run regular reviews. On paid plans, AI takes care of the organising and reviewing, with a free trial.

Personal Task Orchestrator is for solopreneurs (people who run a one-person business) who carry business, family and personal commitments at once. It works inside Obsidian on your vault (your folder of Markdown notes). Every item is an ordinary note, and its details are fields at the top of the note.

The main flow has five stages:

1. **Capture.** Save a thought, a web page clipped with the Obsidian Web Clipper, a physical item or a note already in your vault. Each capture becomes one note whose triage stage (how far the item has been sorted) is `captured`.
2. **Clarify.** Give the item a title, a one-line description, a category, and an area or project. The item moves to `clarified`.
3. **Organise.** Make the item a task, idea, resource or reference, with the fields that type needs. The item moves to `controlled`. A task you are committed to and can act on now becomes a Next Action and appears in the backlog.
4. **Sprint.** Pick tasks from the backlog for a Sprint (a short period of focused work with an end date you choose). Tasks whose due or scheduled date falls in the Sprint join it by themselves.
5. **Review.** Run the operational review to keep the vault complete and current. Then run the commitment review to decide what you are committed to and what matters most.

On the free plan you clarify and organise each item yourself. On the paid plan the AI does both after a short pause, 2 minutes by default. The pause lets you deal with a quick item yourself first.

Your own choices always stand. When you change a value the application set, it records your choice and leaves that value alone until you change it again. Nothing is deleted permanently. A deleted note goes to Obsidian's trash. Nothing is ever removed from the vault audit log (the history of every change to a note's fields).

---

## Key Features

- **Single Source of Capture** — Capture a thought from a command, a hotkey or the ribbon button, or take in a clipped web page or an existing note. Nothing captured is lost: captures waiting for the paid service survive an Obsidian restart, a computer restart and a vault move.
- **Triage: Clarify** — Sets each item's title, one-line description, category, and area or project. On the paid plan the AI writes these values within 10 seconds of the pause window ending, for 95 out of 100 items.
- **Triage: Organise** — Turns each clarified item into a task, idea, resource or reference with the fields its type needs. A task's actionability (whether you can act on it now) follows a fixed rule, and a dependency that would form a loop is refused.
- **Categories, Areas, Projects and Goals** — Ten fixed categories, areas as tags, and projects and goals as notes. You state commitment and priority in two notes, Current Commitments and Current Priorities, and every linked task follows unless you overrode it.
- **Work Dashboard** — A backlog of every task you can act on, in three groups: can do now, delegated and scheduled. The backlog and the Sprint open in under 1 second in a vault of 10,000 notes. A dated task alerts you when it comes due.
- **Operational Review** — One "Start review" command creates a review task with a step task per step of Gather, Refresh and Explore. Each step task holds your own checklist. If any step task cannot be created, none is created.
- **Commitment Review** — Five ordered steps to decide what you are committed to and what matters most. On the paid plan you tick the changes you accept, and they are applied in step order when you mark the review done.
- **Vault Audit Log and Linting** — Every change to a field is recorded with who made it and when. A field you set last belongs to you, and no triage, review or lint pass changes it until you do. Linting (a paid check that keeps the vault consistent) runs after each commitment review.
- **Vault and Notes** — Every item is one ordinary Markdown note you can take anywhere. A note you made by hand is never written to unless you capture it.
- **Export and Import** — Export the whole vault and import it into a fresh copy with no note, field, link or history entry lost. An import that fails part way leaves the vault as it was.
- **Paid Service** — Provides every AI judgement, so you never need an AI account of your own. Every value it returns is checked against the allowed values before it reaches a note.
- **Plans, Licensing and Payment** — A free plan with no AI, and a paid plan with every AI feature and a 90-day free trial. If the licence-key service cannot be reached, paid features keep working for four weeks from the last successful check.
- **Usage Measurement** — The plugin sends nothing from your device except the requests paid features need. Every measure is taken from the paid service's own records.
- **User Configuration Settings** — Settings such as working hours, weekend days and UK or US English live on Obsidian's settings page. They configure what the application decides and never hold a product rule.
- **Application core and test client** — All the rules live in an application core (the part that manages the vault) with no dependency on Obsidian. A command-line test client drives the same core without Obsidian, and the same request has the same checks and effects through either.
- **Structured JSON logs** — `correlationId` (one reference number shared by everything one operation does) on every log line an operation writes; contextual fields such as `errorCode` where applicable
- **Diagnostic command** — one command that confirms the plugin and its application core respond

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Obsidian  (minimum version 1.15.0 · desktop only)      │
└──────────────────────┬──────────────────────────────────┘
                       │ plugin API
┌──────────────────────▼──────────────────────────────────┐
│  Plugin  (lifecycle · settings · one adapter per port)  │
└──────────────────────┬──────────────────────────────────┘
                       │ ports
┌──────────────────────▼──────────────────────────────────┐
│  Application core  (no dependency on Obsidian)          │
│  capture · clarify · organise · structure · dashboard   │
│  review · lint · vault · export-import · settings       │
│  licensing · paid-service                               │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS, only after a trial starts or a key is entered
┌──────────────────────▼──────────────────────────────────┐
│  Paid service  (separate private repository)            │
│  AI judgements · licence checks · trials                │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  Test client  (command line, no Obsidian)               │
│  drives the same core through plain-file adapters       │
└──────────────────────┬──────────────────────────────────┘
                       │ vault and store ports, through either host's adapters
┌──────────────────────▼──────────────────────────────────┐
│  The vault  (Markdown notes)                            │
│  .task-orchestrator/ holds all plugin-owned data        │
└─────────────────────────────────────────────────────────┘
```

Obsidian loads one plugin bundle, `main.js`. This repository also builds a command-line test client. The paid service lives in a separate private repository. The application core reaches the outside world only through ports (a short list of named jobs it needs done, such as "read a note"). The plugin and the test client each supply an adapter (the code that does that job in their own surroundings) for every port. The code is organised as vertical slices (one folder per feature, holding its operations, rules and tests) under `packages/core/src/`. Only the `settings` slice is built so far. The repository tree is in `CLAUDE.md`, Section 3.

---

## Getting Started

### Prerequisites

- [Obsidian](https://obsidian.md/download) — version 1.15.0 or later, on a desktop computer, to run the plugin
- [Node.js](https://nodejs.org/en/download) — version 26, for developers, to build the plugin and run the tests and the test client
- [pnpm](https://pnpm.io/installation) — version 12, for developers, to install dependencies and run the workspace scripts
- [Git](https://git-scm.com/downloads) — for developers, to clone the repository

### Installation

Once the plugin is listed in Obsidian's community plugin directory, install and enable it from there. Until then, install it by hand:

1. Download `main.js`, `manifest.json` and `styles.css` from the latest GitHub release.
2. Copy the three files into `<vault>/.obsidian/plugins/task-orchestrator/`, where `<vault>` is your vault's folder.
3. In Obsidian, enable Personal Task Orchestrator under Community plugins.

To work on the plugin:

1. Clone the repository and change into it.
2. Install dependencies.
3. No environment file is needed.
4. Build the plugin into the development vault and enable it there.

The commands for each step are in [`CLAUDE.md`, Section 9](CLAUDE.md).

---

## Running the Plugin

Run the watch build and open the development vault in Obsidian; the commands are in [`CLAUDE.md`, Section 9](CLAUDE.md).

The plugin reloads in the development vault after each build. Its log lines appear in Obsidian's developer console, and in `.task-orchestrator/logs/application-YYYY-MM.jsonl` in the vault, one file per month.

### Health checks

Run **Check that the application core responds** from the command palette. A notice confirms that the plugin and its application core respond.

To run the same check without Obsidian, use the test client:

```bash
node packages/test-client/src/cli.ts <vault> ping
```

---

## API Reference

> The plugin has no HTTP API. Its internal API is the set of operations and queries below, called in-process through `execute` and `query`.

### Authentication

Not applicable — operations are called in-process, by the plugin and by the command-line test client.

### Operations

An operation is called with `execute` and may change something. A query is called with `query` and only reads. Every result is either `{ ok: true, correlationId, outcome }` or `{ ok: false, correlationId, error: { errorCode, message, retryable, details? } }`, for operations and queries alike.

Only `ping`, `settings` and `updateSettings` are built so far. The others are grouped by the feature they belong to, numbered in the order Key Features lists them.

**Diagnostics**

#### `ping` (version 1) — Check that the application core responds

Reads and writes nothing, and returns the time the core answered.

```json
{
	"name": "ping",
	"version": 1,
	"actor": "user",
	"payload": {}
}
```

**Result** (succeeded):

```json
{
	"ok": true,
	"correlationId": "7c4a8d09-ca72-4024-b234-2d6e9a872b51",
	"outcome": { "respondedAt": "2026-11-11T09:15:02.000Z" }
}
```

**Capture (Feature 1)**

#### `captureThought` (version 1) — Capture a thought

Creates one new note from the text typed in the capture box, at triage stage `captured`, with an optional due date.

```json
{
	"name": "captureThought",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 1 is built.

#### `captureExistingNote` (version 1) — Capture an existing note

Gives a note already in the vault a stable ID and the capture fields, leaving its body unchanged.

```json
{
	"name": "captureExistingNote",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 1 is built.

#### `recogniseClippedNote` (version 1) — Take in a clipped web page

Takes in a note saved by the Obsidian Web Clipper as a capture, recording its web address in `source`.

```json
{
	"name": "recogniseClippedNote",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 1 is built.

#### `captureStatus` (version 1) — Report capture status

Reports the state of captures, including those waiting in the queue while the paid service is unreachable.

```json
{
	"name": "captureStatus",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 1 is built.

**Clarify (Feature 2)**

#### `setClarifyFields` (version 1) — Set the Clarify fields

Sets an item's title, one-line description, category, and area tag or project.

```json
{
	"name": "setClarifyFields",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 2 is built.

#### `markClarified` (version 1) — Move an item to clarified

Moves an item to the triage stage `clarified`, which needs a title and a category.

```json
{
	"name": "markClarified",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 2 is built.

#### `markDoneDuringPause` (version 1) — Mark an item done during the pause

Marks a captured item done during the pause window, making it a done task with no AI call.

```json
{
	"name": "markDoneDuringPause",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 2 is built.

#### `deleteDuringPause` (version 1) — Delete an item during the pause

Moves a captured item to Obsidian's trash during the pause window, before any AI call is made.

```json
{
	"name": "deleteDuringPause",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 2 is built.

#### `pendingTriage` (version 1) — List items waiting for triage

Lists the items that have not finished triage.

```json
{
	"name": "pendingTriage",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 2 is built.

**Organise (Feature 3)**

#### `setOrganiseFields` (version 1) — Set the Organise fields

Sets an item's type and the fields that type carries, such as a task's assignee, due date and effort.

```json
{
	"name": "setOrganiseFields",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 3 is built.

#### `markControlled` (version 1) — Move an item to controlled

Moves an item to the triage stage `controlled` and sets its first status by type.

```json
{
	"name": "markControlled",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 3 is built.

#### `changeType` (version 1) — Change an item's type

Changes a controlled item's type and sends it back through Organise, which adds the new type's fields and clears the rest.

```json
{
	"name": "changeType",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 3 is built.

#### `addBlocker` (version 1) — Add a blocker

Adds a task to another task's `blockedBy` list, refusing a dependency that would form a loop.

```json
{
	"name": "addBlocker",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 3 is built.

#### `removeBlocker` (version 1) — Remove a blocker

Removes a task from another task's `blockedBy` list, after which the task's actionability is worked out again.

```json
{
	"name": "removeBlocker",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 3 is built.

#### `addSubTask` (version 1) — Add a sub-task

Creates a sub-task under a task, which inherits the parent's project, area tag and category.

```json
{
	"name": "addSubTask",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 3 is built.

**Structure (Feature 4)**

#### `createArea` (version 1) — Create an area

Creates an area under a category, refusing a name that is not a valid Obsidian tag name.

```json
{
	"name": "createArea",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `createProject` (version 1) — Create a project

Creates a project under an area, from which it takes its area tag and category.

```json
{
	"name": "createProject",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `createGoal` (version 1) — Create a goal

Creates a goal note, which carries a category.

```json
{
	"name": "createGoal",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `linkProjectToGoal` (version 1) — Link a project to a goal

Links a project and a goal to each other, which raises the project's starting priority from `low` to `normal` while the goal is active.

```json
{
	"name": "linkProjectToGoal",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `commitProject` (version 1) — Commit to a project

Lists a project under Committed Projects in the Current Commitments note, after which every linked task's actionability is worked out again.

```json
{
	"name": "commitProject",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `uncommitProject` (version 1) — Withdraw commitment to a project

Removes a project from Committed Projects, after which the project takes its area's commitment.

```json
{
	"name": "uncommitProject",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `setAreaCommitment` (version 1) — Set an area's commitment

Lists an area under Current Interest Areas or Standing Obligation Areas, or under neither.

```json
{
	"name": "setAreaCommitment",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `listInPriorities` (version 1) — List a note in Current Priorities

Adds a project, area or task to the Current Priorities note, which moves its priority up one level.

```json
{
	"name": "listInPriorities",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `unlistFromPriorities` (version 1) — Remove a note from Current Priorities

Removes a project, area or task from the Current Priorities note, after which its priority is worked out again.

```json
{
	"name": "unlistFromPriorities",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `setRevisitDate` (version 1) — Set a revisit date

Sets the date a commitment or priority decision about a project or area should come back to you.

```json
{
	"name": "setRevisitDate",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `archiveNote` (version 1) — Archive a note

Adds the `archived` tag to a note, and archiving a project or area archives every linked item.

```json
{
	"name": "archiveNote",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `restoreNote` (version 1) — Restore an archived note

Removes the `archived` tag and brings the note back into line with its project or area.

```json
{
	"name": "restoreNote",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `updateDescription` (version 1) — Update a description

Updates the description of an area or project that items are classified against.

```json
{
	"name": "updateDescription",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `commitmentOf` (version 1) — Work out commitment

Works out whether you are committed to a project, area or task, from the Current Commitments note.

```json
{
	"name": "commitmentOf",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

#### `priorityOf` (version 1) — Work out priority

Works out the priority of a project, area or task from its goal link and the Current Priorities note.

```json
{
	"name": "priorityOf",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 4 is built.

**Dashboard (Feature 5)**

#### `newSprint` (version 1) — Create a Sprint

Creates a planned Sprint with an end date on a working day, holding every task whose date qualifies it.

```json
{
	"name": "newSprint",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 5 is built.

#### `addToSprint` (version 1) — Add a task to the Sprint

Adds a task from the "Can do now" group to the Sprint.

```json
{
	"name": "addToSprint",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 5 is built.

#### `startSprint` (version 1) — Start the Sprint

Makes the planned Sprint active and sets its start date to that day.

```json
{
	"name": "startSprint",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 5 is built.

#### `endSprint` (version 1) — End the Sprint

Ends the Sprint, early if you choose, leaving its unfinished tasks in the backlog.

```json
{
	"name": "endSprint",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 5 is built.

#### `backlogGroups` (version 1) — List the backlog groups

Lists every open Next Action in its backlog group: can do now, delegated or scheduled.

```json
{
	"name": "backlogGroups",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 5 is built.

#### `sprintMembers` (version 1) — List the Sprint's tasks

Lists the tasks in the current Sprint.

```json
{
	"name": "sprintMembers",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 5 is built.

#### `dueAlerts` (version 1) — List due alerts

Lists the date alerts that are due, worked out by rule from each note's due and scheduled dates.

```json
{
	"name": "dueAlerts",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 5 is built.

#### `projectsWithoutSprintTask` (version 1) — List committed projects with no Sprint task

Lists each committed, active project that has no task in the Sprint, so the dashboard can show a notice for it.

```json
{
	"name": "projectsWithoutSprintTask",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 5 is built.

**Review (Features 6 and 7)**

#### `startReview` (version 1) — Start a review

Creates the operational and commitment review tasks, each with a step task per included step, all or none.

```json
{
	"name": "startReview",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 6 is built.

#### `completeStep` (version 1) — Complete a review step

Marks one step task of a review done.

```json
{
	"name": "completeStep",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 6 is built.

#### `completeReview` (version 1) — Complete a review

Marks a review task done, and for the commitment review on the paid plan applies your ticked choices in step order.

```json
{
	"name": "completeReview",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 7 is built.

#### `resetChecklist` (version 1) — Reset a step's checklist

Resets the checklist of one review step, or of every step, to the original.

```json
{
	"name": "resetChecklist",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 6 is built.

#### `reviewProgress` (version 1) — Count review progress

Counts the done and remaining step tasks in each stage, for the status bar while the review view is open.

```json
{
	"name": "reviewProgress",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 6 is built.

#### `stepsForStage` (version 1) — List a stage's steps

Lists the step tasks of the current review that belong to one stage.

```json
{
	"name": "stepsForStage",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 6 is built.

**Lint (Feature 8)**

#### `runLint` (version 1) — Run linting

Checks and corrects every active item's placement, type, dates and fields on the paid plan, leaving every field you set alone.

```json
{
	"name": "runLint",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 8 is built.

#### `lintReport` (version 1) — Report on linting

Reports what linting found and corrected.

```json
{
	"name": "lintReport",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 8 is built.

**Vault (Feature 9)**

#### `firstRun` (version 1) — Set up a new vault

Creates the application's own notes, the default settings and the local store, asking only for your name.

```json
{
	"name": "firstRun",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 9 is built.

#### `migrateSchema` (version 1) — Upgrade the field set

Upgrades every managed note to a newer version of the standard field set, keeping each note's ID, content, links and history.

```json
{
	"name": "migrateSchema",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 9 is built.

#### `reconcile` (version 1) — Pick up direct edits

Compares every managed note's fields with the values last recorded, and records each direct edit as your decision.

```json
{
	"name": "reconcile",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 9 is built.

#### `restoreOwnedNote` (version 1) — Restore an application-owned note

Restores one of the application's own notes to its defined content after it was changed, renamed, moved, archived or deleted.

```json
{
	"name": "restoreOwnedNote",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 9 is built.

#### `resolveConflictCopy` (version 1) — Resolve a conflicting copy

Resolves two copies of a note with the same ID, as a sync conflict creates.

```json
{
	"name": "resolveConflictCopy",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 9 is built.

#### `openIssues` (version 1) — List open issues

Lists every open issue, newest first, for the Issues list.

```json
{
	"name": "openIssues",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 9 is built.

#### `noteById` (version 1) — Find a note by ID

Finds a managed note by its stable ID, wherever it has been moved or renamed.

```json
{
	"name": "noteById",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 9 is built.

**Export and import (Feature 10)**

#### `exportVault` (version 1) — Export the vault

Copies every managed note and the local store into a folder you choose, without the licence key.

```json
{
	"name": "exportVault",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 10 is built.

#### `importVault` (version 1) — Import an export

Imports an export into the vault, asking for confirmation if the vault is not empty.

```json
{
	"name": "importVault",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 10 is built.

#### `importPreview` (version 1) — Preview an import

Tells you what an import will do before you confirm it.

```json
{
	"name": "importPreview",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 10 is built.

**Settings (Feature 14)**

#### `updateSettings` (version 1) — Change settings

Changes the language, the minimum log level or both, and saves the settings file whole.

```json
{
	"name": "updateSettings",
	"version": 1,
	"actor": "user",
	"payload": { "language": "en-US" }
}
```

**Result** (succeeded):

```json
{
	"ok": true,
	"correlationId": "3f2b8c1e-9d47-4a6b-8e21-5c0d7f9a1b34",
	"outcome": {
		"settings": {
			"language": "en-US",
			"appliedSettingsMigrations": [],
			"minimumLogLevel": "info"
		}
	}
}
```

**Result** (failed, settings file unreadable):

```json
{
	"ok": false,
	"correlationId": "3f2b8c1e-9d47-4a6b-8e21-5c0d7f9a1b34",
	"error": {
		"errorCode": "SETTINGS_FILE_UNREADABLE",
		"message": "The settings file is unreadable; refusing to overwrite it.",
		"retryable": false
	}
}
```

#### `settings` (version 1) — Read the settings

Reads your settings and says how the settings file was found: `valid`, missing (`defaulted`) or damaged (`corrupt`).

```json
{
	"name": "settings",
	"version": 1,
	"actor": "user",
	"payload": {}
}
```

**Result** (succeeded):

```json
{
	"ok": true,
	"correlationId": "a91e6c52-0b3d-4f87-9c14-6e2d8b7f0a59",
	"outcome": {
		"settings": {
			"language": "en-GB",
			"appliedSettingsMigrations": [],
			"minimumLogLevel": "info"
		},
		"loadStatus": "valid"
	}
}
```

**Licensing (Feature 12)**

#### `startTrial` (version 1) — Start the free trial

Requests a trial key that unlocks every paid feature for 90 days, which is the plugin's first network call.

```json
{
	"name": "startTrial",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 12 is built.

#### `enterKey` (version 1) — Enter a licence key

Stores a paid licence key and checks it, unlocking paid features if it is valid.

```json
{
	"name": "enterKey",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 12 is built.

#### `checkLicence` (version 1) — Check the licence

Checks the licence key with the paid service, which happens in the background every day and at every start.

```json
{
	"name": "checkLicence",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 12 is built.

#### `planState` (version 1) — Report the plan

Reports which plan you are on and whether paid features are on.

```json
{
	"name": "planState",
	"version": 1,
	"actor": "user",
	"payload": { … }
}
```

Not built yet: its payload and outcome are defined when Feature 12 is built.

### Status lifecycle

Every captured item moves through three triage stages. Changing a controlled item's type sends it back to `clarified`, and it returns to `controlled` when Organise finishes.

Status values depend on the note's type. Organise sets the first value when an item reaches `controlled`. Area, person, system and unclassified notes have no status value, so their status field is present and empty. Any value outside these lists is not valid. The application refuses it, and a value typed directly into a note is put back to the previous one.

A Sprint moves through three states. Only one Sprint can be planned or active at a time.

```
Triage stage (every captured item)
  captured → clarified → controlled
  controlled → clarified            (when the item's type changes)

Status: task, project and goal
  to do → in progress → done

Status: idea and resource
  held → reviewed → utilized → done

Status: reference
  filed

Status: area, person, system and unclassified
  (no value: the field is present and empty)

Sprint state
  planned → active → ended
```

### Error codes

All errors follow the format `{DOMAIN}_{CATEGORY}_{DETAIL}`. The domain is `CORE` for the codes every operation shares, or one of `CAPTURE`, `CLARIFY`, `ORGANISE`, `STRUCTURE`, `DASHBOARD`, `REVIEW`, `LINT`, `VAULT`, `EXPORT_IMPORT`, `SETTINGS`, `LICENSING` or `PAID_SERVICE`. The `retryable` field indicates whether the same request may succeed if tried again unchanged.

| Code                         | Retryable | Meaning                                                                  |
| ---------------------------- | --------- | ------------------------------------------------------------------------ |
| `CORE_TARGET_NOT_FOUND`      | No        | The note the request names does not exist                                |
| `CORE_INPUT_INVALID`         | No        | The request has the wrong shape, or a value is not allowed for the field |
| `CORE_CONFIRMATION_REQUIRED` | No        | The action needs a confirmation that has not been given                  |
| `CORE_STORE_UNAVAILABLE`     | Yes       | The local store cannot be read, so nothing is written                    |
| `CORE_INTERNAL_ERROR`        | No        | An unexpected fault inside the application core                          |
| `SETTINGS_FILE_UNREADABLE`   | No        | The settings file could not be read, so it is not overwritten            |
| `ORGANISE_BLOCKER_LOOP`      | No        | The dependency would form a loop between tasks                           |
| `REVIEW_ALREADY_OPEN`        | No        | A review cannot start while a review task is still open                  |

The plugin also handles these codes from the paid service: `LICENCE_INVALID`, `LICENCE_EXPIRED`, `RATE_LIMITED`, `PROVIDER_UNAVAILABLE`, `ANSWER_INVALID`, `PLUGIN_TOO_OLD`, and `SERVICE_UNREACHABLE`, which the plugin raises itself when no answer arrives.

---

## CLI Usage

The test client is a command-line interface for developers and AI agents. It runs any registered operation or query against a vault folder without Obsidian and prints its result as JSON on standard output. Log lines go to standard error. The exit code is 0 when the result is ok, 1 when it is not and 2 for a usage error.

The command takes the form `node packages/test-client/src/cli.ts <vaultPath> <operationName> [jsonPayload] [--version <n>] [--log-level <level>]`. For example, this switches a vault to US English:

```bash
node packages/test-client/src/cli.ts ./my-vault updateSettings '{"language":"en-US"}'
```

Its full contract is in the comment at the top of `packages/test-client/src/cli.ts`.

---

## Testing

Test locations, conventions and commands are in [`CLAUDE.md`, Sections 6 and 9](CLAUDE.md).

---

## Configuration

All configuration is through the plugin's settings tab in Obsidian. No environment file is needed.

| Setting                     | Default                                                                          | Description                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Timezone                    | Set when Feature 14 is built                                                     | The time zone used for dates, alerts and working days                                                             |
| Daily working hours         | Set when Feature 14 is built                                                     | Start and end times. An alert for a date with no time fires at the start time                                     |
| Weekend days                | Set when Feature 14 is built                                                     | Days that are not working days. A Sprint cannot end on one                                                        |
| Maybe wait (paid)           | Set when Feature 14 is built                                                     | 30 to 365 days before a Maybe item (a task you are considering, or a held idea or resource) is listed in a review |
| Operational review steps    | Set when Feature 14 is built                                                     | Which steps to include, and a reset of any step's checklist to its original                                       |
| Clarify pause window (paid) | 2 minutes                                                                        | How long to wait before the AI clarifies a capture, up to 1,440 minutes                                           |
| Language and spelling       | UK English                                                                       | UK or US English for the application's wording                                                                    |
| Date format                 | Set when Feature 14 is built                                                     | How dates are shown. Stored values do not change                                                                  |
| Your name                   | Set on first run                                                                 | The title of your person note, which your own tasks link to                                                       |
| Context list                | `discuss`, `process`, `search`, `analyse`, `message`, `create`, `errand`, `plan` | The work modes a task can have. You may add or delete any value                                                   |
| Date alerts                 | Set when Feature 14 is built                                                     | Turns date alerts on or off                                                                                       |
| Licence key and trial start | None                                                                             | Starts the free trial or enters a paid key. Until then you are on the free plan                                   |

Settings are stored in `.task-orchestrator/settings.json` in the vault. The licence key is the exception. It is kept in Obsidian's secret storage (Obsidian's protected store for passwords and keys), never in that file. So far the settings tab shows only the language setting. How settings are read and saved is described in `packages/core/src/settings/README.md`.

**Database connection strings:** Not applicable — a plugin has no database. Plugin-owned data is kept in the `.task-orchestrator/` folder at the top of the vault. Its name starts with a dot, so Obsidian's file explorer, search and Bases do not show it.

---

## Disclosures

Obsidian's developer policies require each of the following to be stated here.

- **Network use** — The plugin uses the network only to reach the paid service, which provides every AI feature and checks licence keys. It does so only after you start the free trial or enter a licence key. On the free plan it makes no network call.
- **Accounts** — No sign-in account is needed. Paid features need a licence key, either a trial key or a paid key, and each key works on one computer only.
- **Payment** — Optional. The free plan needs no payment. The paid plan is a subscription with a 90-day free trial. It is sold through a payment service that is the merchant of record (the business that legally sells to you and handles sales tax). The directory listing's payment type is "Optional payment".
- **Files outside the vault** — None. The plugin writes only inside the vault.
- **Telemetry** — None from your device. The plugin sends nothing except the requests paid features need. The paid service keeps a log of each request and of each call it makes to an AI provider. It also keeps a profile for each licence key. Unless you opt out, it also stores the content sent to and received from AI providers. To opt out, email a request, and the owner records it against your key. Opting out stops content being stored and deletes what was stored before. A link to the privacy policy will be added here when the privacy policy is published.
- **Third-party licences** — Listed in `NOTICES.md`.

---

## FAQs

**Do I need an AI account or an API key?**

No. The paid service provides every AI judgement. On the free plan no AI is used at all.

**What can I do on the free plan?**

Everything except the AI features and the paid non-AI features. You capture items, then clarify and organise them yourself, using the same fields the paid plan uses. You run Sprints and reviews with the same steps.

**Does it work offline?**

Yes. Every free feature works offline. On the paid plan, captures made while the paid service is unreachable wait in a queue, and you see one notice. When the service returns, they are triaged without any action from you.

**Will the application change notes I wrote myself?**

Not unless you capture them. A note you made by hand has no stable ID, and the application never writes to it. Once a note is managed, any value you set stays as you set it.

**Can I use one licence key on two computers?**

No. A key works on one computer only, and a key cannot be moved to another computer. Two computers need two keys.

**What happens if the licence-key service cannot be reached?**

The plugin tells you and retries in the background. Paid features keep working for four weeks from the last successful check.

**Where can I find logs and diagnostics?**

Logs are structured JSON, one object per line, written to Obsidian's developer console and to `.task-orchestrator/logs/application-YYYY-MM.jsonl` in the vault, one file per month. Each entry carries `correlationId` (on every line an operation writes) and `errorCode` where applicable. For ad-hoc investigation, open Obsidian's developer console. Log lines hold no note content and no licence key.

---

## Contributing

The repository is public because Obsidian's community plugin directory requires it, but contributions are by invitation of the owner only.

Conventions for working on this codebase — architecture, branch naming, commit messages, pre-commit checks, tests — are in [`CLAUDE.md`](CLAUDE.md).

---

## License

This project is published under the Elastic License 2.0, which lets you use, copy, modify and redistribute the software but not offer it to others as a hosted or managed service, and not remove or bypass its licence-key functionality (see `LICENSE`). Third-party licences are listed in `NOTICES.md`.
