<!--
TEMPLATE — template_readme.md
Produces the repository's README.md. Keep every section, heading, ordering and
formatting exactly as written. Text in [square brackets] is a slot: replace it
with this application's content from the PRD, the TAD and the code, then remove
the brackets. Everything outside brackets is kept as written. Delete this
comment block from the finished file.
-->

# [Application name]

> [One-sentence description of what the system takes in and what it returns.]

[One badge per item in the tech stack, each of the form `![Tool](https://img.shields.io/badge/[tool]-[version]-[colour]?logo=[logo]&logoColor=white)`, followed by:]
![License](https://img.shields.io/badge/license-[licence]-lightgrey)

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Getting Started](#getting-started)
5. [Running the Services](#running-the-services)
6. [API Reference](#api-reference)
7. [CLI Usage](#cli-usage)
8. [Testing](#testing)
9. [Configuration](#configuration)
10. [FAQs](#faqs)
11. [Contributing](#contributing)
12. [License](#license)

---

## Overview

[What the system does and for whom; its main processing flow, as a numbered list where it has stages; and any retention or lifecycle fact a user must know. Written from the PRD.]

---

## Key Features

- **[Feature name]** — [what it does and the concrete guarantee: an endpoint, a limit, a timing target]
- [One bullet per feature in the same form]
- **Structured JSON logs** — [the correlation IDs this application carries, beginning with `request_id` on API logs]; contextual fields such as `error_code` where applicable
- **Health endpoints** — liveness, database connectivity, and full readiness checks

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  [Client / frontend]                                    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│  API Service  ([framework] · [server] · port [port])    │
│  [the API-facing slices]                                │
└──────────────────────┬──────────────────────────────────┘
                       │ [the link to the next tier]
[one box per further service tier, in the same form]
┌──────────────────────▼──────────────────────────────────┐
│  [Database and version]                                 │
│  [extensions · tenancy model · backup policy]           │
└─────────────────────────────────────────────────────────┘
```

[The process model — how many services, from how many images — and that the code is organised as vertical slices under `app/`. The repository tree is in `CLAUDE.md`, Section 3.]

---

## Getting Started

### Prerequisites

[One bullet per tool a developer must install before the Installation steps, each of the form `- [Tool](link to its install page) — what it is for`.]

### Installation

1. Clone the repository and change into it.
2. Install dependencies.
3. Copy `.env.example` to `.env` and populate it — at minimum set `DATABASE_URL`.
4. Start the local database and apply migrations.

The commands for each step are in [`CLAUDE.md`, Section 9](CLAUDE.md).

---

## Running the Services

Run the [service / services] locally, or all of them in containers; the commands for both are in [`CLAUDE.md`, Section 9](CLAUDE.md).

The API will be available at `http://localhost:[port]`. Interactive docs at `http://localhost:[port]/docs`.

### Health checks

```bash
curl http://localhost:[port]/health          # liveness
curl http://localhost:[port]/health/db       # database connectivity
curl http://localhost:[port]/health/ready    # full readiness
```

---

## API Reference

> Full interactive documentation is available at `http://localhost:[port]/docs` when the server is running.

### Authentication

[How callers authenticate, in one sentence, followed by the header in a code block:]

```
Authorization: Bearer <api_key>
```

### Endpoints

[One subsection per endpoint. Each subsection: a `####` heading of the form `` `METHOD /path` — What it does ``, one sentence, a `curl` example, then one JSON response block per distinct response, labelled in bold with its status code:]

#### `POST /api/v1/orders` — Create an order

Submit an order for processing.

```bash
curl -X POST http://localhost:[port]/api/v1/orders \
  -H "Authorization: Bearer <api_key>" \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "…", "line_items": [ … ]}'
```

**Response** (`202 Accepted`):

```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "request_id": "7c4a8d09-ca72-4024-b234-2d6e9a872b51"
}
```

### Status lifecycle

[The status transitions as a plain-text diagram; name any value that is deliberately not valid.]

```
queued → processing → succeeded
                    → failed
```

### Error codes

All errors follow the format [the error-code format]. The `retryable` field indicates whether the client should retry without modifying the request.

| Code                       | HTTP | Retryable | Meaning                        |
| -------------------------- | ---- | --------- | ------------------------------ |
| [`DOMAIN_CATEGORY_DETAIL`] | [n]  | [Yes/No]  | [one line]                     |
| `BILLING_PROVIDER_TIMEOUT` | 503  | Yes       | Payment provider call timed out |

---

## CLI Usage

[Who the command-line interface is for, what it does, one example invocation in a `bash` block, and where its full contract is documented. With no command-line interface: None.]

---

## Testing

Test locations, conventions and commands are in [`CLAUDE.md`, Sections 6 and 9](CLAUDE.md).

---

## Configuration

All configuration is via environment variables. Copy `.env.example` to `.env` to get started.

| Variable          | Required | Default                                                | Description                                             |
| ----------------- | -------- | ------------------------------------------------------ | ------------------------------------------------------- |
| `DATABASE_URL`    | Yes      | —                                                      | [Database connection string, with its scheme]           |
| `ENVIRONMENT`     | No       | `development`                                          | `development` or `production`                           |
| `LOG_LEVEL`       | No       | `INFO`                                                 | `DEBUG`, `INFO`, `WARNING`, `ERROR`                     |
| `APP_NAME`        | No       | `[Application name]`                                   | Application name in logs and API responses              |
| `API_PREFIX`      | No       | `/api/v1`                                              | URL prefix for API routes                               |
| `ALLOWED_ORIGINS` | No       | `["http://localhost:3000","http://localhost:[port]"]`  | CORS allowed origins (JSON array)                       |
| [`VARIABLE`]      | [Yes/No] | [default or —]                                         | [one line — one row per application-specific setting]   |

[Where any further configuration reference lives, e.g. a TAD section.]

**Local database connection string:**

```
DATABASE_URL=[the local connection string]
```

**Hosted database connection string:**

```
DATABASE_URL=[the hosted connection string, with credentials as placeholders]
```

---

## FAQs

[One entry per question a first-time user is likely to ask: the question in bold, a blank line, then a short answer in plain prose.]

**[Question?]**

[Answer.]

**Where can I find logs and diagnostics?**

Service logs are structured JSON emitted to stdout. Each entry carries [the correlation IDs this application carries, beginning with `request_id` (from the `X-Request-ID` header)] and `error_code` where applicable. [Where to look for ad-hoc investigation, e.g. the database console or documented SQL queries.]

---

## Contributing

[Who may contribute, in one sentence, e.g. "This is a private project. Contributions are by invitation only."]

Conventions for working on this codebase — architecture, branch naming, commit messages, pre-commit checks, tests — are in [`CLAUDE.md`](CLAUDE.md).

---

## License

[The licence statement, e.g. "Proprietary. All rights reserved.", one sentence on what that permits, and any third-party licence obligation the application carries.]
