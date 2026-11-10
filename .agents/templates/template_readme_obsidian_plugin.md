<!--
TEMPLATE — template_readme_obsidian_plugin.md
Produces the README.md of an Obsidian plugin repository. It mirrors
template_readme.md section for section and departs from it only where a plugin
cannot follow a web service. Keep every section, heading, ordering and
formatting exactly as written. Text in [square brackets] is a slot: replace it
with this application's content from the PRD, the TAD and the code, then remove
the brackets. Everything outside brackets is kept as written, with one
exception: the samples in the API Reference section (the `placeOrder`
operation, the lifecycle diagram and the `BILLING_PROVIDER_TIMEOUT` row) show the form the
slots beside them take, and are replaced by this application's content. The
README describes the product the PRD and TAD define, and states nothing beyond
them. Delete this comment block from the finished file.
-->

# [Application name]

> [One-sentence description of what the plugin does for its user.]

[One badge per item in the tech stack, each of the form `![Tool](https://img.shields.io/badge/[tool]-[version]-[colour]?logo=[logo]&logoColor=white)`, followed by:]
![License](https://img.shields.io/badge/license-[licence]-lightgrey)

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

[What the plugin does and for whom; its main flow, as a numbered list where it has stages; and any retention or lifecycle fact a user must know. Written from the PRD.]

---

## Key Features

- **[Feature name]** — [what it does and the concrete guarantee: a command, a limit, a timing target]
- [One bullet per feature in the same form]
- **Structured JSON logs** — [the correlation IDs this application carries, beginning with `correlationId` on every log line an operation writes]; contextual fields such as `errorCode` where applicable
- **Diagnostic command** — one command that confirms the plugin and its application core respond

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Obsidian  (minimum version [version] · [platforms])    │
└──────────────────────┬──────────────────────────────────┘
                       │ plugin API
┌──────────────────────▼──────────────────────────────────┐
│  Plugin  (lifecycle · settings · one adapter per port)  │
└──────────────────────┬──────────────────────────────────┘
                       │ ports
┌──────────────────────▼──────────────────────────────────┐
│  Application core  (no dependency on Obsidian)          │
│  [the feature slices]                                   │
└──────────────────────┬──────────────────────────────────┘
                       │ [the link to the next tier]
[one box per further tier, such as a headless client or a remote service, in the same form]
┌──────────────────────▼──────────────────────────────────┐
│  The vault  (Markdown notes)                            │
│  [where plugin-owned data is kept]                      │
└─────────────────────────────────────────────────────────┘
```

[The process model — what Obsidian loads, and any other program built from this repository — and that the code is organised as vertical slices under `packages/core/src/`. The repository tree is in `CLAUDE.md`, Section 3.]

---

## Getting Started

### Prerequisites

[One bullet per tool needed before the Installation steps, each of the form `- [Tool](link to its install page) — what it is for`, with the tools a user needs listed before the tools only a developer needs.]

### Installation

[How a user installs the plugin: from Obsidian's community plugin directory once it is listed there, or by copying `main.js`, `manifest.json` and `styles.css` from the latest release into the vault's plugin folder.]

To work on the plugin:

1. Clone the repository and change into it.
2. Install dependencies.
3. No environment file is needed.
4. Build the plugin into the development vault and enable it there.

The commands for each step are in [`CLAUDE.md`, Section 9](CLAUDE.md).

---

## Running the Plugin

Run the watch build and open the development vault in Obsidian; the commands are in [`CLAUDE.md`, Section 9](CLAUDE.md).

The plugin reloads in the development vault after each build. Its log lines appear in Obsidian's developer console[, and where else they are written].

### Health checks

Run **[the diagnostic command's name]** from the command palette. A notice confirms that the plugin and its application core respond.

[With a headless client: the one command that runs the same check without Obsidian, in a `bash` block.]

---

## API Reference

> The plugin has no HTTP API. Its internal API is the set of operations and queries below, called in-process through `execute` and `query`.

### Authentication

Not applicable — operations are called in-process, by the plugin and by [any other host this application has].

### Operations

[One subsection per operation or query. Each subsection: a `####` heading of the form `` `name` (version n) — What it does ``, one sentence, the request as a JSON block, then one JSON result block per distinct result, labelled in bold:]

#### `placeOrder` (version 1) — Create an order

Record an order for processing.

```json
{
  "name": "placeOrder",
  "version": 1,
  "actor": "user",
  "payload": { "customerId": "…", "lineItems": [ … ] }
}
```

**Result** (succeeded):

```json
{
  "ok": true,
  "correlationId": "7c4a8d09-ca72-4024-b234-2d6e9a872b51",
  "outcome": { "orderId": "550e8400-e29b-41d4-a716-446655440000", "status": "queued" }
}
```

### Status lifecycle

[The status transitions as a plain-text diagram; name any value that is deliberately not valid.]

```
queued → processing → succeeded
                    → failed
```

### Error codes

All errors follow the format [the error-code format]. The `retryable` field indicates whether the same request may succeed if tried again unchanged.

| Code                       | Retryable | Meaning                         |
| -------------------------- | --------- | ------------------------------- |
| [`DOMAIN_CATEGORY_DETAIL`] | [Yes/No]  | [one line]                      |
| `BILLING_PROVIDER_TIMEOUT` | Yes       | Payment provider call timed out |

---

## CLI Usage

[Who the command-line interface is for, what it does, one example invocation in a `bash` block, and where its full contract is documented. With no command-line interface: None.]

---

## Testing

Test locations, conventions and commands are in [`CLAUDE.md`, Sections 6 and 9](CLAUDE.md).

---

## Configuration

All configuration is through the plugin's settings tab in Obsidian. No environment file is needed.

| Setting     | Default       | Description                                  |
| ----------- | ------------- | -------------------------------------------- |
| [`Setting`] | [default]     | [one line — one row per setting]             |

[Where the settings are stored, and where any further configuration reference lives, e.g. a TAD section.]

**Database connection strings:** Not applicable — a plugin has no database. [Where plugin-owned data is kept.]

---

## Disclosures

Obsidian's developer policies require each of the following to be stated here.

- **Network use** — [None, or each remote service the plugin contacts, when, and why it is needed]
- **Accounts** — [None, or which features need an account and with whom]
- **Payment** — [None, or which features need payment]
- **Files outside the vault** — [None, or what is read or written outside the vault and why]
- **Telemetry** — [None, or what is collected, where it is sent, and how to turn it off]
- **Third-party licences** — [where the licence notices of bundled and copied code are listed]

---

## FAQs

[One entry per question a first-time user is likely to ask: the question in bold, a blank line, then a short answer in plain prose.]

**[Question?]**

[Answer.]

**Where can I find logs and diagnostics?**

Logs are structured JSON, one object per line, written to [where log lines go]. Each entry carries [the correlation IDs this application carries, beginning with `correlationId`] and `errorCode` where applicable. [Where to look for ad-hoc investigation, e.g. Obsidian's developer console.]

---

## Contributing

[Who may contribute, in one sentence, e.g. "This is a private project. Contributions are by invitation only."]

Conventions for working on this codebase — architecture, branch naming, commit messages, pre-commit checks, tests — are in [`CLAUDE.md`](CLAUDE.md).

---

## License

[The licence statement, e.g. "Proprietary. All rights reserved.", one sentence on what that permits, and any third-party licence obligation the application carries.]
