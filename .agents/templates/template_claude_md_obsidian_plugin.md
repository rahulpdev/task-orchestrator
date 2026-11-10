<!--
TEMPLATE — template_claude_md_obsidian_plugin.md
Produces the CLAUDE.md of an Obsidian plugin repository. It mirrors
template_claude_md.md section for section and departs from it only where a
TypeScript plugin cannot follow a Python service. Keep every section, heading,
ordering and formatting exactly as written. Text in [square brackets] is a
slot: replace it with this application's content from the PRD and TAD, then
remove the brackets. Everything outside brackets is kept as written. The code
examples are kept as written too: they show format, and their customer and
order names are placeholders. Only their error codes change, and only where
this application's error-code format differs from the one they use. Delete this
comment block from the finished file.
-->

# [Application name] — Global Agent Rules

## 1. Core Principles

**VERBOSE NAMING IS NON-NEGOTIABLE**

- Clarity over brevity, always

**STRUCTURED JSON LOGGING IS MANDATORY**

- Every operation logs start + completion (or failure) with contextual fields
- Dotted namespace events: `domain.component.action_state`
- [The correlation-ID rule for this application, beginning: `correlationId` on every log line an operation writes]

**SECURITY AND DATA HANDLING ARE NON-NEGOTIABLE**

- Never read, modify, or commit files containing API keys, tokens, credentials, or private certificates
- Never commit sensitive configuration files, private data files, or files with embedded plaintext secrets
- Use Obsidian's secret storage; never store credentials in plaintext
- Ensure compliance with relevant data protection regulations (e.g., GDPR, CCPA)

**TYPE SAFETY IS REQUIRED**

- Full type annotations on every function signature
- The compiler's strict mode and the type-checked lint rules must both pass
- No `// eslint-disable` or `// @ts-` comment without a documented reason on the same line, and never one that disables a security or `obsidianmd/*` rule

**REQUIREMENT ALIGNMENT IS REQUIRED**

- Maintain a three-way match between: stated requirements (PRD, TAD), implementation plan, and final code
- When a change makes any statement in this file untrue, correct this file in the same change

**TSDOC ON ALL EXPORTED FUNCTIONS**

- `/** … */` with `@param` and `@returns`

**KISS** (Keep It Simple, Stupid)

- Prefer simple, readable solutions over clever abstractions

**YAGNI** (You Aren't Gonna Need It)

- Defer building features until they're actually needed

**SOLUTIONS MUST BE GROUNDED**

- Demonstrate solutions are grounded in project docs, existing code, or verified research.

---

## 2. Tech Stack

### Application core

- **Language:** [language and version, with the Node version used for build and tests]
- **Package manager:** [package manager and version, with the workspace's packages]
- **Framework:** Not applicable — the core is plain TypeScript behind ports, with [schema library and version floor] for validation
- **ORM:** Not applicable — notes are reached only through the vault port
- **Logging:** [logging mechanism (output format)]
- **Database:** Not applicable — [where plugin-owned data is kept]
- **Lint/format:** [linter, rule sets and formatter, with versions (indentation, quote style, line width)]
- **Type checking:** [the compiler mode and the type-checked lint configuration (both required)]
- **Testing:** [unit test runner and real-Obsidian test harness, with version floors]

### Plugin

- **Obsidian API:** [`obsidian` types version; minimum app version; desktop-only or mobile-capable]
- **Bundler:** [bundler and the single file it produces]
- **Interface:** [the settings approach and the interface elements the plugin uses]
- **Data access:** Ports only (the plugin package supplies one adapter per port; nothing else touches the vault)

---

## 3. Architecture

```
packages/
├── core/src/               # Application core — never imports `obsidian`, Electron or Node
│   ├── core/               # Universal infra — required by all slices
│   │   ├── ports.ts        # The port interfaces
│   │   ├── api.ts          # Operation registry, versions, Result
│   │   ├── errors.ts       # AppError and error codes
│   │   ├── logging.ts      # Logger, correlation ID, LogSink port
│   │   ├── ids.ts          # Identifier generation
│   │   ├── testing/        # In-memory adapters and a pretend clock for every test
│   │   └── README.md       # The decision rule for what belongs here
│   ├── shared/             # Cross-feature utilities (3+ slice rule)
│   ├── {feature}/          # Vertical slices: [the slice names from the TAD]
│   │   ├── operations.ts
│   │   ├── rules.ts
│   │   ├── schemas.ts
│   │   ├── README.md
│   │   └── *.test.ts       # Colocated unit tests (no Obsidian, no file system)
│   └── index.ts            # The core's public surface
├── plugin/src/             # The Obsidian plugin — thin
│   ├── main.ts             # Lifecycle only
│   ├── adapters/           # One adapter per port, using Obsidian's API
│   └── settings/           # The settings tab
[└── any further package this application has, one line each with its purpose]
__mocks__/obsidian.ts       # The shim unit tests use in place of `obsidian`
e2e-tests/                  # Tests inside a real Obsidian
test-vault/                 # Fixture vault for development and e2e tests
scripts/                    # Build checks, version bump, manifest check
```

**Rules:**

- `packages/core/` — never imports `obsidian`, Electron or a Node module; the boundary check fails the lint step if it does
- `core/core/` — infrastructure only; never imports feature slices or `shared/`
- `shared/` — only code used by **3 or more** feature slices; never feature-specific logic
- Each feature slice is self-contained; a slice uses only what another slice publishes through its `index.ts`
- `main.ts` does lifecycle and nothing else
- [The process-model rule for this application: what Obsidian loads, and any other program built from this repository]

---

## 4. Code Style

Code examples in this file show format only. Their customer and order names are placeholders, not part of this application; the files to imitate are listed in Section 8.

### Size limits

- **Files:** 300 lines max — refactor into modules when approaching this limit
- **Functions:** 50 lines max — extract helpers if a function grows beyond this
- **Parameters:** Move constants, configurations, and long strings to separate files.

### Naming

- Functions, variables and object properties: `camelCase`
- Types, classes and Zod schemas: `PascalCase`
- Fields: verbose — `customerId`, `orderStatus`, `createdAt` (never `id`, `status`)
- Constants: `UPPER_SNAKE_CASE`

### TSDoc (required on all exported functions)

```ts
/**
 * Finds a single customer by its identifier.
 *
 * Reads the customer's note through the vault port and returns its
 * validated fields if the note exists.
 *
 * @param customerId - Identifier of the customer to find.
 * @param vault - The vault port the note is read through.
 * @returns The customer if found, `null` otherwise.
 */
export async function findCustomerById(
	customerId: string,
	vault: VaultPort,
): Promise<Customer | null> {
```

### ORM models — always use shared mixins

Not applicable — a plugin has no ORM. Its data shapes are the schemas below.

### Schemas

```ts
import * as z from 'zod';

export const CustomerSchema = z.object({
	customerId: z.string(),
	customerStatus: CustomerStatusSchema,
	createdAt: z.string(),
});

export type Customer = z.infer<typeof CustomerSchema>;
```

> **Vault data exception:** Fields written to a note keep exactly the names the PRD fixes (e.g., `id`, `status`), however short. Variables, properties and types inside the code must always use verbose names. When a schema describes vault data, its keys are the PRD's names and the code maps them to verbose names where it reads them.

---

## 5. Logging

```ts
// `log` is the logger an operation is given; it already carries the correlationId
log.info('orders.checkout.validation_started', { orderId });
```

**Event name format:** `domain.component.action_state`

- Good: `orders.checkout.validation_started`, `billing.invoice.generation_failed`
- Bad: `validation_started`, `failed`, `checkout`

**States:** `_started`, `_completed`, `_failed` (general); `_validated`, `_rejected` (validation operations)

**Always include contextual fields; never log bare messages.**

**Never log secrets, licence keys, credentials, or note contents.**

```ts
// Operation start + completion pair
log.info('orders.checkout.validation_started', { orderId });

const validation = validateOrder(order);

log.info('orders.checkout.validation_completed', {
	orderId,
	lineItemCount: validation.lineItemCount,
	totalAmount: validation.totalAmount,
});

// Error with structured context
log.error('orders.checkout.validation_failed', {
	orderId,
	errorCode: 'ORDERS_INPUT_EMPTY_CART',
});
```

[How the correlation ID is set and carried, beginning: **`correlationId`** is generated by `execute` / `query` when the caller supplies none, and reaches every log line through the logger each operation is given.]

---

## 6. Testing

### Test locations

| Test type              | Location                     | Runner                                                |
| ---------------------- | ---------------------------- | ----------------------------------------------------- |
| Core unit              | beside the code, `*.test.ts` | Vitest, no shim                                       |
| Plugin unit            | beside the code, `*.test.ts` | Vitest, `obsidian` aliased to `__mocks__/obsidian.ts` |
| Inside a real Obsidian | `e2e-tests/`                 | `wdio-obsidian-service`, `earliest` and `latest`      |
[one row per further test type this application has]

### Rules

- Tests must cover happy paths, edge cases, boundary conditions, and failure/error paths
- `e2e-tests/` is reserved for tests inside a real Obsidian — never place unit tests there
- Core unit tests: no Obsidian, no file system, no network -- the in-memory adapters and pretend clock in `core/core/testing/` stand in for every port
- Plugin unit tests run against the shim; the shim reflects assumptions, so the real-Obsidian tests are what prove the integration
- Test names: `describe` the function, `it` states the condition and the expected result
- Async tests need no special marker -- an `async` test function is awaited
- In-memory adapters live in `core/core/testing/` -- always use them, never write a second stand-in for a port inside a slice

### Unit test example

```ts
describe('validateOrder', () => {
	it('returns ORDERS_INPUT_EMPTY_CART when the order has no line items', () => {
		const validation = validateOrder({ orderId: 'order-1', lineItems: [] });

		expect(validation).toEqual({
			ok: false,
			error: expect.objectContaining({
				errorCode: 'ORDERS_INPUT_EMPTY_CART',
				retryable: false,
			}),
		});
	});
});
```

### Real-Obsidian test example

```ts
describe('place order command', () => {
	it('shows the confirmation notice when the order is placed', async () => {
		await browser.executeObsidianCommand('[plugin id]:place-order');

		await expect($('.notice')).toHaveText(expect.stringContaining('Order placed'));
	});
});
```

---

## 7. Error Handling

**Error code format:** [the error-code format for this application and its domain list] -- e.g., `ORDERS_INPUT_EMPTY_CART`, `BILLING_PROVIDER_TIMEOUT`

```ts
return {
	ok: false,
	error: {
		errorCode: 'ORDERS_INPUT_EMPTY_CART',
		message: 'An order must contain at least one line item.',
		retryable: false,
	},
};
```

- Inside the core, failures are values: return a failed result with an `AppError`; never throw across the core's boundary
- Messages shown to the user are **intentionally plain**
- An `AppError`'s `message` is a diagnostic for the log; what the user sees comes from the messages module, keyed by `errorCode`
- Notices must be non-sensitive; put full diagnostics in structured logs only
- `execute` / `query` convert any thrown error into a failed `Result` with the internal-error code automatically
- `execute` / `query` attach the `correlationId` to every `Result`; handlers never pass it
- Event handlers in the plugin never throw, and no promise is left floating

**`Result` shape** (canonical across all operations and queries):

```ts
type Result<TOutcome> =
	| { ok: true; correlationId: string; outcome: TOutcome }
	| { ok: false; correlationId: string; error: AppError };

interface AppError {
	errorCode: string; // [the error-code format]
	message: string;
	retryable: boolean;
	details?: Record<string, unknown>;
}
```

---

## 8. Common Patterns

Each pattern has one reference implementation in the repository. Read the file for the pattern you are about to write before writing it, and add a row when a pattern first appears.

| Pattern | Reference file |
| ------- | -------------- |
[One row per pattern the repository already implements, each naming a file that exists: at minimum a documented exported function, a start + completion log pair, a returned `AppError`, an operation definition, a port adapter, a unit test and a real-Obsidian test. A pattern with no implementation yet has no row.]

- [Where reference material for recurring patterns lives under `.agents/reference/`, or that it is to come.]

---

## 9. Development Commands

```bash
# Setup — NEVER edit dependency declarations directly, always use the package manager's add / remove commands
# Dependencies — update as part of the same change whenever packages are introduced or removed
pnpm install                                               # Install all dependencies

# Running the plugin
pnpm dev                                                   # Watch build into the development vault
[one line per additional program, such as a headless client]

# Database
# Not applicable — a plugin has no database

# Tests
pnpm test                                                  # Unit tests with coverage (fast)
pnpm e2e                                                   # Tests inside a real Obsidian (earliest and latest)

# Lint, format, type checking (run all before committing)
pnpm lint && pnpm format:check
pnpm typecheck

# Build and release
pnpm build                                                 # Production build; writes main.js at the root
pnpm check:manifest                                        # Manifest and versions.json rules
[version-bump command]                                     # Bump the version in every file that carries it

# Containers
# Not applicable — a plugin runs inside Obsidian
```

---

## 10. Human Communication Rules

**PHILOSOPHY**

- You may read highly technical materials and perform senior-level engineering work, but communication with the project owner must be calibrated to their role and background.
- Treat the project owner as:
  - a nontechnical executive for product, business, delivery, risk, and prioritisation matters
  - a junior engineer for implementation matters
  - an intelligent decision-maker who needs clear explanations, not oversimplification

**SCOPE**

- Applies to every reply addressed to the project owner, including progress updates, code explanations, document walkthroughs, answers to questions, and general project conversation.
- Does **not** apply to the underlying artefacts themselves. Source code, docstrings, reference documents, sub-agent prompts, and commit messages remain appropriately technical.
- These rules govern how you talk to the project owner about those artefacts.

**GOAL**

- The goal is not to reduce complexity. The goal is to make complexity navigable.
- Preserve important technical nuance, but explain it in a way the project owner can follow.
- Act like a senior technical advisor, teacher, and implementation partner to the project owner.

**PRACTICAL RULES**

- Start with the practical meaning before technical detail.
- Explain why something matters, not only what happened.
- Omit performative agreement, generic setup, repeated summaries, and adjacent detail that does not improve understanding, decision making, or progress tracking.
- Use technical terms when useful, but define or contextualise them when they may not be obvious.
- When citing a document section, briefly explain what that section is for; do not rely on section numbers alone.
- When explaining code, first describe what it does, what it produces, and where it fits before walking through implementation detail.
- When comparing options, give the plain-language consequence of each option before technical trade-offs.
- Prefer concrete examples over abstract architecture language.
- Do not assume the project owner can infer implications from technical shorthand.
- Do not dumb things down; make the real issue legible.
- Calibrate depth to the situation: brief for simple updates, deeper for architecture, risk, scope, learning, or important decisions.
- When depth is needed, explain in layers: plain-English meaning, project impact, technical mechanism, then trade-offs or edge cases.
- If the project owner appears confused, frustrated, or uncertain, slow down and reframe before continuing.
- Avoid meta-commentary such as "honest answer" or "fair criticism"; just state the point clearly.

**FAILURE MODES**

- Too technical: senior-engineer shorthand without explanation.
- Too simplistic: removing detail the project owner needs to make informed judgments.

**PROJECT OWNER CONTROL**

- Optimise communication for understanding, decision making, progress tracking, and the project owner's ability to intervene and stay in control of the project.

---

## 11. AI Agent Instructions

<!-- Rebuild this list from the sections present in the finished file; every item must point at a section that exists. -->

1. **Match the vertical slice** per Section 3
2. **Log every operation** per Section 5
3. **Use verbose field names** per Section 4
4. **Keep the core free of host imports** per Section 3
5. **Error codes and failed results** per Section 7
6. **Write colocated tests** per Section 6
7. **Run linters and type checkers before finishing** per Section 9
8. **No suppression comments without a documented reason** per Section 1
9. **Never import across feature slices** per Section 3
10. **Imitate the reference implementations** per Section 8
11. **Never use git commands:** `git add .`, `git add -A` or `git add --all`
12. **Communicate with the project owner** per Section 10
