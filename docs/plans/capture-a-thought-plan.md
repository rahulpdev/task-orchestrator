# Feature: Capture a thought

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

In the Personal Task Orchestrator, an Obsidian plugin, the command "Capture a thought" opens a box with a single-line text field, an optional date picker, Save and Cancel. Saving creates one managed note whose `title` holds the typed text exactly, with an empty body. Its file name is the text with only the changes a file-system or Obsidian limit requires, plus two normalisations Obsidian applies to every path (Task 8 lists them).

Its front matter, the block of fields at the top of the note, holds in this order: `id`, `title`, `type: unclassified`, an empty `status`, `triage: captured`, `dateCreated`, `dateModified`, and `due`, which holds the chosen date or is present and empty.

Each field the capture sets gets one entry in the vault audit log, the permanent history of every change to a note's fields, kept in `.task-orchestrator/audit/YYYY-MM.jsonl`. `.task-orchestrator/` is the folder at the top of the vault where the application keeps its own files; this plan calls it the store. A capture's entries share its correlation ID (one identifier shared by everything one request does). Entry IDs and correlation IDs are ULIDs, identifiers that sort by the time they were made.

If the entries cannot be written after the note is, the note stays, and the plugin retries them every 15 seconds without ever writing one twice. Entries still waiting when Obsidian closes are lost; recovering them is deferred to later work. If the store fails 3 times in a row, the application refuses new captures and shows the user one plain notice, until the store can be read again.

The same request through the command-line test client gives the same note fields and audit entries, apart from generated identifiers and timestamps, and a test inside a real Obsidian compares the two. This is the first product feature, built on the existing settings feature, ports, logging and test client.

The plan implements Option 4 of `docs/options/capture-a-thought-options-evaluation.md` ("Core-owned capture, with audit retries held in memory and driven by a scheduler tick"), with one change by the owner, the person who directs the project: a due date chosen at capture is recorded as the user's decision (see Notes).

## User Story

As a solopreneur using Obsidian
I want to type a thought into a box and have it saved at once as a note the application manages
So that nothing stays in my head, and every captured item has a recorded history the later sorting steps can build on

## Problem Statement

As of 27 November 2026, nothing in the repository creates a managed note or writes the vault audit log. Nothing shows that one operation gives the same result inside Obsidian and through the test client, which acceptance criterion F15-AC1 of the product requirements document (PRD) requires. The problem definition is `docs/options/capture-a-thought-problem-definition.md`; its "Settled decisions and constraints" and "Done means" sections bind this plan.

## Solution Statement

- **The capture slice.** A new `capture` slice (a self-contained feature folder in the application core), laid out like the settings slice, holds the `captureThought` operation (version 1) and the rules for usable text, the file name and the starting fields.
- **The audit writer.** A new writer in `packages/core/src/core/audit/` builds entries in the line format of section 3.3 of the technical architecture document (TAD), writes a capture's entries in one write, keeps failed entries in memory and retries them without writing any twice, and tracks whether the store is healthy.
- **The tick.** `Core.tick()` retries the waiting audit entries; the plugin's new `scheduler.ts` calls it every 15 seconds.
- **Two port functions.** Ports are the interfaces through which the core reaches the vault, the store and the settings. `StorePort.appendLines` writes several lines in one write. `SettingsPort.loadForThisComputer` reads the "automatic changes" setting, kept separately on each computer and on unless switched off; when it is off, a capture creates its note but writes no audit entries.
- **ULIDs.** From the `ulid` package, through `core/ids.ts`.
- **The plugin.** It gets the capture box, the command and the scheduler. Both vault adapters (the code that reads and writes notes) stop changing file names, because the core now decides them.
- **The host comparison.** A real-Obsidian test compares a capture made in Obsidian with the same capture made through the test client.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: `packages/core` gains the capture slice, the audit writer, ULIDs, two port functions and `Core.tick()`; `packages/plugin` gains the capture box, the command and the scheduler, and its adapters change; `packages/test-client` gains the new port functions, ULID correlation IDs and capture tests. Also `e2e-tests/`, `README.md`, `CLAUDE.md` and `NOTICES.md`.
**Dependencies**: `ulid` 3.0.2 (MIT licence, no dependencies of its own), added to `@task-orchestrator/core`

---

## RUNTIME ENVIRONMENT

- **Subprocess and CLI calls**: None at run time. Tests run the test client's command line through `spawnSync(process.execPath, …)`, as `packages/test-client/src/cli.test.ts:30-33` already does; it needs only Node 26, which `.nvmrc` sets.
- **HTTP calls and external services**: None applicable. Nothing in this loop uses the network (PRD D8). `pnpm add` in Task 3 reaches the npm registry once, on the developer's machine.
- **Filesystem paths outside the repository**:
  - In Obsidian: the vault's `.task-orchestrator/` folder, and Obsidian's per-vault local storage for the per-computer setting. The code creates both on first use.
  - Test client: one file beside the vault folder, `<vault path>.task-orchestrator-this-computer.json`. The application only reads it; tests create it. A missing file means nothing is set. Task 4 makes `packages/test-client/src/test-helpers/vault-copy.ts` delete it when a test's vault copy is removed.
- **Environment variables**: None applicable.
- **Credentials and tokens**: None applicable.
- **Services and scheduled jobs**: One timer inside Obsidian: `window.setInterval` every 15 seconds, registered with `plugin.registerInterval` (Task 12), started after the workspace layout is ready and cleared by Obsidian when the plugin unloads. A retry round that throws shows up as `core.audit.retry_failed` in the application log (the diagnostic log in `.task-orchestrator/logs/`, separate from the vault audit log); a fault in the timer code itself shows up as `plugin.scheduler.tick_failed`. No timer runs in the test client.

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

The PRD and TAD are not in this branch's working copy. Read them at `/Users/rahulmac/SoftwareProjects/task-orchestrator/docs/PRD.md` and `/Users/rahulmac/SoftwareProjects/task-orchestrator/docs/TAD.md`. Line numbers below were checked on 27 November 2026 at commit `48b891c`; no file under `packages/` has changed since commit `e613e3a`.

- `docs/options/capture-a-thought-problem-definition.md` (whole file) - Why: the binding scope, rulings and "Done means" checks.
- `docs/options/capture-a-thought-option-4.yaml` (whole file) - Why: the chosen design, with the reasoning for every rule this plan uses. Its one superseded point is the due-date actor (lines 73-80); follow this plan instead.
- `CLAUDE.md` (whole file) - Why: naming, logging, error, test and file-size rules (300 lines per file, 50 per function).
- `packages/core/src/settings/` (all files) - Why: the reference for a whole slice (CLAUDE.md Section 8). `operations.ts` lines 27-75 show `defineOperation`, a returned `AppError` and a completion log line.
- `packages/core/src/core/api.ts` (lines 44-51 `OperationContext`, the object every operation receives; 145-156 `createDispatcher`, which checks each request and runs the matching operation; 158-173 `dispatchSafely`; 215-256 `runHandler`; 276-284 `pickCorrelationId`) - Why: the context gains the audit writer and correlation IDs become ULIDs; Task 2 splits the file first.
- `packages/core/src/core/ports.ts` (lines 61-145 `VaultPort`; 151-190 `StorePort`; 193-208 `SettingsPort`; 276-284 `CoreAdapters`) - Why: two functions are added; Task 1 splits the file first.
- `packages/core/src/core/ids.ts` (lines 7-26) - Why: `newCorrelationId` is "the single place to change if correlation IDs become ULIDs".
- `packages/core/src/core/logging.ts` (lines 88-89 event-name pattern; 124-130 `describeThrown`) - Why: every new event name must pass `validateEventName`; `describeThrown` logs an error's message, which may hold the file path.
- `packages/core/src/core/errors.ts` (lines 45-51 `CORE_ERROR_CODES`; 81-90 `createAppError`) - Why: the error model the capture returns.
- `packages/core/src/core/messages/types.ts`, `en-GB.ts`, `en-US.ts`, `messages.test.ts` - Why: every new word goes here, typed with `satisfies MessageCatalogue`.
- `packages/core/src/core/testing/` (`index.ts` lines 43-54 `createTestAdapters`; `in-memory-store.ts`; `in-memory-settings.ts`; `in-memory-vault.ts` lines 131-140 `freePath`, 182-193 `createNote`) - Why: the in-memory stand-ins every core test uses; they gain the new port functions.
- `packages/core/src/index.ts` (lines 49-51 `CORE_OPERATIONS`; 84-87 `CoreOptions`; 90-121 `Core`; 131-149 `createCore`) - Why: register the operation, add `tick()` and `currentLanguage`.
- `packages/core/src/index.test.ts` (lines 6-14) - Why: asserts exactly three runtime exports; this plan adds none.
- `packages/plugin/src/main.ts` (lines 53-84 `onload`) - Why: wire in the scheduler, the language option and the command.
- `packages/plugin/src/commands.ts` (lines 19-37) and `commands.test.ts` - Why: pattern for a command whose handler catches its own errors.
- `packages/plugin/src/notices.ts` (lines 16-18 `noticeForError`, which picks a failure's own wording or the general "something went wrong" wording; 26-30 `describeError`, the plugin's own function for describing a thrown value in a log line) - Why: Tasks 11 and 12 use both.
- `packages/plugin/src/adapters/index.ts` (lines 45-77) - Why: where adapters are built from the plugin.
- `packages/plugin/src/adapters/store-adapter.ts` (whole file; CLAUDE.md's reference adapter) - Why: `appendLines` mirrors `appendLine` (lines 55-59).
- `packages/plugin/src/adapters/settings-adapter.ts` (whole file) - Why: gains `loadForThisComputer`.
- `packages/plugin/src/adapters/vault-adapter.ts` (lines 28-55 `VaultAdapterHost`; 67-68 `FORBIDDEN_TITLE_CHARACTERS`; 117-129 `renameNote`; 219-248 `createNote`, `freeNotePath`) - Why: stops changing names, checks taken names case-aware, honours "same folder as current file", and removes a half-made note.
- `packages/plugin/src/adapters/log-sink-adapter.ts` (lines 37-62) - Why: the promise-chain pattern that runs appends one at a time; the audit writer copies it.
- `packages/plugin/src/test-helpers/fake-core.ts` (whole file) - Why: the plugin tests' adapters; it gains the new port functions.
- `packages/test-client/src/adapters/file-store-adapter.ts`, `file-settings-adapter.ts`, `file-vault-adapter.ts` (lines 99-111 `renameNote`, 165-179 `createNote`, 193-201 `freeFilePath`), `note-file.ts` (lines 147-156 `sanitiseTitle`), `index.ts`, `cli.ts` (lines 105-131 `main`) - Why: the test client's adapters and command line change.
- `packages/test-client/src/test-helpers/vault-copy.ts`, `scenario.test.ts`, `cli.test.ts`, `adapters/adapters.test.ts` - Why: test patterns against a temporary copy of `test-vault/`.
- `e2e-tests/smoke.e2e.ts` (whole file) - Why: the real-Obsidian test pattern (CLAUDE.md Section 8), including `executeObsidian`, `executeObsidianCommand` and reading files through `app.vault.adapter`.
- `scripts/check-core-boundary.ts` (lines 113-134) - Why: a slice may import another slice only through its `index.ts`; `core/` imports only from `core/`.
- `eslint.config.mts` (lines 53-79) - Why: the core may not import Obsidian, Electron or Node built-ins.
- `vitest.config.ts` (lines 7-16) - Why: the core must keep 80% line coverage.
- `NOTICES.md` (lines 5-36) - Why: the format of a bundled-code notice, for `ulid`.

### New Files to Create

- `packages/core/src/core/vault-port.ts` - The vault port and its value types, moved out of `ports.ts` (Task 1).
- `packages/core/src/core/api-types.ts` - The request, result, context and definition types, moved out of `api.ts` (Task 2).
- `packages/core/src/settings/automatic-changes.ts` and `automatic-changes.test.ts` - The per-computer setting loader (Task 5).
- `packages/core/src/core/audit/schemas.ts` - The audit entry schema (Task 6).
- `packages/core/src/core/audit/entries.ts` - Builds entries from field values; gives the month file path.
- `packages/core/src/core/audit/audit-log.ts` - The writer: record, retry, store health, notice.
- `packages/core/src/core/audit/audit-log.test.ts`, `entries.test.ts` - Unit tests.
- `packages/core/src/capture/schemas.ts`, `rules.ts`, `operations.ts`, `index.ts`, `README.md` - The capture slice (Task 8).
- `packages/core/src/capture/rules.test.ts`, `operations.test.ts` - Unit tests.
- `packages/plugin/src/adapters/note-creation.ts` - `createNote` and `freeNotePath`, moved out of `vault-adapter.ts` to keep it under 300 lines (Task 10).
- `packages/plugin/src/modals/capture-modal.ts` - The capture box (Task 11).
- `packages/plugin/src/modals/capture-submission.ts` and `capture-submission.test.ts` - The box's submit logic, unit tested.
- `packages/plugin/src/scheduler.ts` and `scheduler.test.ts` - The 15-second tick (Task 12).
- `packages/test-client/src/comparison/blank-generated-values.ts` and `blank-generated-values.test.ts` - Blanks IDs and timestamps so that an Obsidian capture and a test-client capture can be compared (Task 14).
- `packages/test-client/src/capture-scenario.test.ts` - File-system tests of every capture behaviour.
- `e2e-tests/capture.e2e.ts` - Real-Obsidian tests of the box and of the comparison (Task 15).

### Relevant Documentation

- `/Users/rahulmac/SoftwareProjects/task-orchestrator/docs/PRD.md`
  - 3.0.1-3.0.2: the fields every managed note carries, and which fields each type adds. 3.0.5: what a vault audit log entry holds; the log is never edited; if the store is missing or unreadable, writing stops and the user is told.
  - F1.1-F1.2: the capture box and a capture's starting fields. F1-AC1: an empty capture creates nothing. F1-AC2: one audit entry per field set.
  - F8.1: a change the user makes through the application is the user's decision. F8.2: the application leaves alone a field the user set last.
  - F9.10-F9.12 and F9-AC8: one computer per vault makes automatic changes; with the setting off, a capture writes its note and nothing else.
  - F15-AC1: the same result through the plugin and the test client. 4.2: the capture box. 4.4: "Nothing blocks the user from capturing."
  - Why: the requirements behind the definition; F8.1 grounds the owner's due-date ruling.
- `/Users/rahulmac/SoftwareProjects/task-orchestrator/docs/TAD.md`
  - E4: note IDs are UUIDs. E5 and 2.7: the audit log's entries and correlation IDs are ULIDs, from the `ulid` package. E6 and 2.4: "The core has no timers of its own. The scheduler tick prompts the core every 15 seconds." 2.2: `core.tick(now)`. 2.5: where new notes go and how file names are made. 3.1: every change goes through a named, versioned operation. 3.2: the port functions. 3.3: the audit line format, and the store-unavailable behaviour. 7.1: the same-result test.
  - Why: the design this plan follows; Tasks 1-12.
- `node_modules/.pnpm/obsidian@1.14.4_@codemirror+state@6.7.6_@codemirror+view@6.43.13/node_modules/obsidian/obsidian.d.ts` (the pinned types; the authority for every signature)
  - Line 1398 `App.loadLocalStorage(key)` and line 1406 `saveLocalStorage(key, data)`, both `@since 1.8.7`: per-vault storage; returns `null` when unset. Why: Tasks 4 and 15.
  - Line 4375 `FileManager.getNewFileParent(sourcePath, newFilePath?)`, `@since 1.1.13`: "sourcePath … used when the user wants new files to be created 'in the same folder'. Use an empty string if there is no active file." Why: Task 10; this confirms that the `''` the adapter passes today ignores that setting.
  - Line 3083 `Component.registerInterval(id)`. Why: Task 12.
  - Line 6540 `Modal` (`contentEl`, `scope`, `open`, `close`, `onOpen`, `onClose`); line 6766, the `Notice` constructor accepts `string | DocumentFragment`. Why: Task 11.
  - Line 3271 `DataAdapter.append`. Why: Task 4.
  - Line 10954 `Workspace.getActiveFile()`. Why: Task 10.
- [ulid on npm](https://www.npmjs.com/package/ulid) and [ULID specification](https://github.com/ulid/spec)
  - Version 3.0.2, published 30 November 2025. It exports `ulid`, `monotonicFactory` and `decodeTime`. A monotonic generator keeps IDs made in the same millisecond in the order they were made; `monotonicFactory()(seedTime)` takes the time in milliseconds. Option 4 (lines 111-117) reports that the browser build esbuild bundles uses `globalThis.crypto`, and that the Node build tests use imports `node:crypto`. Why: Task 3.
- [Zod 4 ISO dates](https://zod.dev/api#iso-dates)
  - `z.iso.date()` accepts only `YYYY-MM-DD` and checks that the date exists; it is declared in the installed `zod@4.6.7` (`v4/classic/iso.d.ts`). Why: Task 8.
- [HTML input type=text](https://html.spec.whatwg.org/multipage/input.html#text-(type=text)-state-and-search-state-(type=search))
  - The value sanitisation algorithm strips line breaks from a single-line input, including pasted text. Why: Task 11.

### Patterns to Follow

**Naming Conventions:** verbose names (`captureText`, `noteId`, `auditLogStatus`, `pendingAuditBatchCount`); `UPPER_SNAKE_CASE` constants; `PascalCase` Zod schemas (`CaptureThoughtRequestSchema`); relative imports carry `.ts`; type-only imports use `import type`; no enums (use `as const` objects or literal unions). Fields written to a note or to an audit line keep their stored names: `id` and `type` in front matter; the short audit keys explained in Task 6. From `packages/core/src/settings/schemas.ts:28-31`:

```ts
export const SettingsChangeSchema = z.strictObject({
	language: z.enum(LANGUAGES).optional(),
	minimumLogLevel: z.enum(LOG_LEVELS).optional(),
});
```

**Error Handling:** handlers return failures as values and never throw across the core's boundary. From `packages/core/src/settings/operations.ts:102-114`:

```ts
function unreadableFailure(): { readonly ok: false; readonly error: ReturnType<typeof createAppError> } {
	return {
		ok: false,
		error: createAppError(SETTINGS_FILE_UNREADABLE, 'The settings file is unreadable; refusing to overwrite it.', false),
	};
}
```

**Logging Pattern:** the dispatcher writes `core.api.operation_started` and `operation_completed` or `operation_failed` (`api.ts:228-254`); a slice adds one contextual line, never note content (`settings/operations.ts:72`):

```ts
context.log.info('settings.file.update_completed', { changedSettingNames });
```

Event names are `domain.component.action_state`, the third part with at least two snake-case words (`logging.ts:88-89`). The new names in this plan, each written by the task named:

- Task 5: `settings.automatic_changes.value_unexpected`, `settings.automatic_changes.read_failed`
- Task 6: `core.audit.append_failed`, `core.audit.retry_completed` (a retry wrote a waiting batch), `core.audit.store_marked_unavailable`, `core.audit.store_recovered`
- Task 7: `core.audit.retry_failed`
- Task 8: `capture.thought.capture_completed`, `capture.thought.capture_rejected`, `capture.thought.note_create_failed`
- Task 11: `plugin.capture.submit_failed`
- Task 12: `plugin.command.capture_failed`, `plugin.scheduler.tick_failed`

**One-at-a-time async work:** `packages/plugin/src/adapters/log-sink-adapter.ts:52-59` chains every append onto one promise, so `write` returns at once and no background task is left running with its errors unhandled.

**Port adapter:** `packages/plugin/src/adapters/store-adapter.ts`: a `create…Adapter` factory taking only the host objects it needs, as narrow `Pick` types so tests can pass small fakes without casts.

**Plugin handlers:** every event handler catches its own errors, and no promise is left unhandled (`commands.ts:28-34`).

**Tests:** `describe` the function, and `it` states the condition and the result; core tests use only `core/testing/` stand-ins (`settings/operations.test.ts:15-29` builds a dispatcher over them).

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

File splits to stay under 300 lines, identifiers, the two new port functions in every adapter, and the per-computer setting loader.

**Tasks:** 1-5

### Phase 2: Core Implementation

The audit writer, the dispatcher context, `Core.tick()`, the capture slice and its words.

**Tasks:** 6-8

### Phase 3: Integration

The vault adapters stop changing names; the plugin gets the box, the command and the scheduler; the test client is wired up.

**Tasks:** 9-13

### Phase 4: Testing & Validation

Test-client scenario tests, the comparison inside a real Obsidian, documents and the full check run.

**Tasks:** 14-17

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

Rules for every task:

- Add dependencies only with `pnpm add`.
- No suppression comment without a same-line reason, and never one that disables a security or `obsidianmd/*` rule.
- Every exported function gets TSDoc with `@param` and `@returns`.
- Inside `packages/core/`, never write the host application's name; the boundary check bans the word.
- After each task passes its validation, commit with `/git:commit`, staging files by path.

### Task 1: REFACTOR `packages/core/src/core/ports.ts` into `vault-port.ts`

- **IMPLEMENT**: Move `FrontMatterValue`, `FrontMatter`, `NoteSnapshot`, `NoteDocument`, `FrontMatterPatch`, `FrontMatterExpectation`, `VaultWriteOutcome`, `VaultChange` and `VaultPort` (lines 10-145) unchanged into `core/vault-port.ts`. Re-export them from `ports.ts` with `export type { … } from './vault-port.ts';`. Update the TSDoc of `VaultPort.create` and `rename`: the title passed in is already a valid file name, and the adapter only adds a number when the name is taken.
- **PATTERN**: the re-exports in `packages/core/src/index.ts:23-47`.
- **GOTCHA**: `ports.ts` is 284 lines; Task 4's two functions with TSDoc would take it past 300. Every existing import of these types keeps working through the re-export.
- **VALIDATE**: `pnpm typecheck && pnpm lint && wc -l packages/core/src/core/ports.ts`

### Task 2: REFACTOR `packages/core/src/core/api.ts` into `api-types.ts`

- **IMPLEMENT**: Move `Actor`, `OperationKind`, `RequestEnvelopeSchema`, `CoreRequest`, `Result`, `HandlerResult`, `OperationContext`, `OperationDefinition`, `OperationRegistry` and `Dispatcher` (lines 16-89) into `core/api-types.ts`. `api.ts` re-exports them (`export { RequestEnvelopeSchema } from './api-types.ts'; export type { … } from './api-types.ts';`). Behaviour is unchanged.
- **PATTERN**: as Task 1.
- **GOTCHA**: `api.ts` is 298 lines, and Tasks 3 and 7 add to it. `import-x/no-cycle` fails the lint step if `api-types.ts` imports `api.ts`.
- **VALIDATE**: `pnpm test && pnpm lint && wc -l packages/core/src/core/api.ts`

### Task 3: ADD `ulid` and UPDATE `packages/core/src/core/ids.ts`

- **IMPLEMENT**:
  - Run `pnpm add --filter @task-orchestrator/core ulid@3.0.2`. It has no install script, so `allowBuilds` in `pnpm-workspace.yaml` stays as it is.
  - In `ids.ts`, keep `newId()`, which makes UUIDs for note IDs (TAD E4). Add one module-level generator, `const ULID_GENERATOR = monotonicFactory();`, and `export function newUlid(moment: Date): string { return ULID_GENERATOR(moment.getTime()); }`.
  - Change `newCorrelationId()` to `newCorrelationId(moment: Date): string`, returning `newUlid(moment)`. Update its TSDoc: correlation IDs are ULIDs (TAD E5, TAD 2.7).
  - In `api.ts`, `pickCorrelationId` takes the clock and calls `newCorrelationId(clock.now())`; `dispatchSafely` passes `services.clock`.
  - Update `ids.test.ts`: `newId` still matches the UUID v4 pattern; `newUlid` and `newCorrelationId` match `/^[0-9A-HJKMNP-TV-Z]{26}$/`; two ULIDs made with the same `Date` sort in the order they were made; `decodeTime(newUlid(moment))` equals `moment.getTime()`.
  - Using the `/drafting:seamless-edit` command, add a "ulid" entry to `NOTICES.md` under "Bundled third-party code", in the Zod entry's format, with the MIT text and copyright line from `node_modules/.pnpm/ulid@3.0.2/node_modules/ulid/LICENSE`.
- **PATTERN**: `ids.ts:16-26`; `NOTICES.md:9-36`.
- **IMPORTS**: `import { monotonicFactory } from 'ulid';`
- **GOTCHA**: One module-level generator for the whole core keeps same-millisecond IDs in order; its state holds no secrets. Do not seed `newCorrelationId` from `Date.now()`: tests use a pretend clock.
- **VALIDATE**: `pnpm vitest run --project core packages/core/src/core/ids.test.ts packages/core/src/core/api.test.ts && pnpm typecheck`

### Task 4: ADD `StorePort.appendLines` and `SettingsPort.loadForThisComputer` in every adapter

- **IMPLEMENT**:
  - In `ports.ts`:
    - `appendLines(storePath: string, lines: readonly string[]): Promise<void>`. TSDoc: it appends every line, each followed by a newline, in one write, creating missing folders; an empty string in `lines` writes an empty line.
    - `loadForThisComputer(settingName: string): Promise<unknown>`. TSDoc: it reads a value kept only on this computer, returns `null` when nothing is stored, and throws only for unexpected faults.
  - `core/testing/in-memory-store.ts`: implement `appendLines`. Add three test switches to `InMemoryStore`:
    - `failingAppendCount: number`: the next N appends reject with an `Error`;
    - `writesBeforeFailure: boolean`: when true, a failing append writes its lines first and then rejects;
    - `unreadable: boolean`: when true, `readFile` and `listFolder` reject.
  - `core/testing/in-memory-settings.ts`: add `computerValues: Map<string, unknown>` and `loadForThisComputer` reading it (a missing key gives `null`).
  - Plugin `store-adapter.ts`: `appendLines` calls `ensureParentFolder` once, then one `dataAdapter.append(filePath, lines.map((line) => `${line}\n`).join(''))`.
  - Plugin `settings-adapter.ts`: widen the parameter to `Pick<Plugin, 'loadData' | 'saveData' | 'app' | 'manifest'>`. `loadForThisComputer` returns `pluginSettingsFile.app.loadLocalStorage(`${pluginSettingsFile.manifest.id}:${settingName}`)`, assigned first to a variable typed `unknown`.
  - Plugin `test-helpers/fake-core.ts`: add `appendLines` to `createMemoryStore` and `loadForThisComputer: () => Promise.resolve(null)` to the settings stand-in.
  - Test client `file-store-adapter.ts`: `appendLines` uses `mkdir`, then one `appendFile(filePath, joined, 'utf8')`.
  - Test client `file-settings-adapter.ts`: export `thisComputerFilePathFor(vaultPath)`, returning `${path.resolve(vaultPath)}.task-orchestrator-this-computer.json`. `loadForThisComputer` reads that file; a missing file gives `null`; otherwise it parses the JSON object and returns its `settingName` value, or `null`.
  - `test-helpers/vault-copy.ts`: `removeCopy` also removes `thisComputerFilePathFor(vaultPath)` with `rm(…, { force: true })`.
  - Tests, one per adapter: `appendLines` writes two lines in one call and creates folders; `loadForThisComputer` gives `null` when nothing is stored and `false` when `false` is stored.
- **PATTERN**: `store-adapter.ts:55-59` (`appendLine`); `file-settings-adapter.ts:61-77`; `secrets-adapter.test.ts` (plain-object fakes).
- **GOTCHA**: `app.loadLocalStorage` returns `any`; assigning it to a variable typed `unknown` lets the type-checked lint rules pass without a suppression comment. The `Plugin` stand-in in `__mocks__/obsidian.ts` needs no change, because tests pass plain objects.
- **VALIDATE**: `pnpm vitest run --project plugin --project test-client && pnpm typecheck`

### Task 5: CREATE the per-computer setting loader in the settings slice

- **IMPLEMENT**:
  - `settings/automatic-changes.ts`: `export const AUTOMATIC_CHANGES_SETTING_NAME = 'automaticChanges';` and `loadAutomaticChangesForThisComputer(settings: SettingsPort, log: Logger): Promise<boolean>`. Only a stored `false` means off; `null`, `true` and anything else mean on. An unexpected value (neither `null` nor a boolean) logs `settings.automatic_changes.value_unexpected` with `storedValueType` and counts as on. A throw logs `settings.automatic_changes.read_failed` and counts as on.
  - `settings/index.ts`: publish both.
  - `settings/automatic-changes.test.ts`: nothing stored, `false`, `true`, `'off'` (logged, counts as on), and a port that throws (logged, counts as on).
  - `settings/README.md`, using the `/drafting:seamless-edit` command: add the per-computer value under Flows and Rules: it is on unless switched off; the capture slice reads it; the control that writes it comes later (PRD F14.1, F9.1).
- **PATTERN**: `settings/operations.ts:77-100`.
- **GOTCHA**: "On unless switched off" is the definition's rule. Do not add `saveForThisComputer`: the control is out of scope.
- **VALIDATE**: `pnpm vitest run --project core packages/core/src/settings`

### Task 6: CREATE the vault audit log writer in `packages/core/src/core/audit/`

- **IMPLEMENT**:
  - `schemas.ts`: `AuditEntrySchema = z.strictObject({ e: z.string(), t: z.string(), n: z.string(), f: z.string(), v: <FrontMatterValue>, a: z.enum(['application', 'user']), m: z.enum(['rule', 'ai']).nullable(), c: z.string(), o: z.string() })` and `type AuditEntry`. The keys are TAD 3.3's stored names, kept short to keep the file small (CLAUDE.md "Vault data exception"):

    | Key | Holds |
    | --- | --- |
    | `e` | the entry's own ID, a ULID |
    | `t` | when, as a UTC timestamp |
    | `n` | the note's `id` |
    | `f` | the field's name |
    | `v` | the field's new value |
    | `a` | who made the change: `application` or `user` |
    | `m` | how the application decided: `rule` or `ai`; `null` when the user made the change |
    | `c` | the operation's correlation ID |
    | `o` | which operation made the change; `capture` for this plan |

    TAD 3.3 also defines `p`, `mo` and `r` (the AI provider, model and reason) and `x` (extra details for reviews). The capture uses none, so they are left out.
  - `entries.ts`: `buildAuditEntry(fields: { noteId, fieldName, fieldValue, actor, method, correlationId, operationName, moment })` returning an `AuditEntry` with `e: newUlid(moment)` and `t: moment.toISOString()`. `auditMonthPath(entry)` returns `audit/${entry.t.slice(0, 7)}.jsonl` (TAD 3.3).
  - `audit-log.ts`: `createAuditLog(dependencies: { store, notifier, log, clock, currentLanguage, messagesFor })` returning an `AuditLog` with four functions:
    - `checkStore(): Promise<boolean>`. It returns `false` if the store is marked unavailable. Otherwise it awaits `store.listFolder('')` and returns `true`; on a throw it counts one failure and returns `false`.
    - `record(batch: readonly AuditEntry[]): Promise<'written' | 'pending'>`. It makes one call to `store.appendLines(auditMonthPath(batch[0]), batch.map((entry) => JSON.stringify(entry)))`. On success it resets the failure count and returns `'written'`. On a throw it logs `core.audit.append_failed` (with the batch's correlation ID and `entryCount`, never field values), keeps the batch in memory, counts one failure and returns `'pending'`.
    - `retryPending(): Promise<AuditLogStatus>`. In order:
      1. If the store is marked unavailable, try `store.listFolder('')`. If it throws, stop this round. If it works and no batch is waiting, the store has recovered (step 4).
      2. For each waiting batch: read its month file with `store.readFile`; collect the `e` of every line that parses as `AuditEntrySchema`, skipping lines that do not; append only the entries whose `e` is missing. If the file is not empty and does not end with a newline, put `''` first in the lines, so a half-written line stays on its own line.
      3. On success, remove the batch and log `core.audit.retry_completed` with its correlation ID and `entryCount`. On a throw, count one failure and stop this round.
      4. When the store was marked unavailable and no batch is waiting any longer, clear the mark, reset the failure count and log `core.audit.store_recovered`.
      5. A round with nothing to do writes no log line.
    - `status(): AuditLogStatus`, returning `{ pendingAuditBatchCount, storeAvailable }` from the writer's memory.
    - Store health: after 3 failures in a row, mark the store unavailable, log `core.audit.store_marked_unavailable`, and show `messagesFor(currentLanguage()).notices.storeUnavailable` through `notifier.notice`, once per outage.
    - Run every append, and every read that leads to an append, one at a time through one promise chain, as `log-sink-adapter.ts:52-59` does, so a capture and a retry never append the same batch.
  - Tests (`audit-log.test.ts`, `entries.test.ts`), with `createInMemoryStore`, `createRecordingNotifier` and `createPretendClock`:
    - a first append writes one line per entry in `audit/2026-01.jsonl`;
    - a failing append returns `'pending'`, and a retry writes the batch;
    - a failing append that had already written (`writesBeforeFailure`) is retried without duplicates;
    - a file ending mid-line gets the newline first;
    - three failures in a row give exactly one notice, and a fourth gives none;
    - while the store is unavailable, `checkStore` returns `false`;
    - recovery with a batch waiting writes it and logs `store_recovered`; recovery with nothing waiting also logs `store_recovered`; a later outage notifies again;
    - a round with nothing waiting writes no log line;
    - `status()` reports the counts.
- **PATTERN**: `log-sink-adapter.ts:37-62`; `settings/operations.ts:77-100` for logging around port calls with `describeThrown`.
- **IMPORTS**: `newUlid` from `../ids.ts`; types from `../ports.ts`, `../logging.ts` and `../messages/index.ts`.
- **GOTCHA**: `core/audit/` is under `core/`, so it may import only from `core/` (`check-core-boundary.ts` rule 1). Keep `audit-log.ts` under 300 lines and each function under 50 by splitting the retry round into helpers. Never log a field value.
- **VALIDATE**: `pnpm vitest run --project core packages/core/src/core/audit && pnpm lint`

### Task 7: UPDATE the dispatcher, `createCore` and the messages for the writer and `Core.tick()`

- **IMPLEMENT**:
  - `api-types.ts`: `OperationContext` gains `readonly auditLog: AuditLog`.
  - `api.ts`: `createDispatcher(registry, adapters, logger, clock, auditLog)` keeps the writer in its services and puts it on every context.
  - `packages/core/src/index.ts`:
    - `CoreOptions` gains `readonly currentLanguage?: () => Language`, defaulting to `() => 'en-GB'`.
    - `createCore` builds the writer once, with `createAuditLog({ store: adapters.store, notifier: adapters.notifier, log: logger, clock: adapters.clock, currentLanguage, messagesFor })`, and passes it to the dispatcher.
    - `Core` gains `tick(): Promise<{ readonly pendingAuditBatchCount: number; readonly storeAvailable: boolean }>`. It returns `auditLog.retryPending()`. It never rejects: on a throw it logs `core.audit.retry_failed` and returns `auditLog.status()`.
  - `core/testing/index.ts`: add `createTestAuditLog(adapters: CoreAdapters): AuditLog`, so tests that build a dispatcher by hand get a real writer over the in-memory store.
  - Messages: `types.ts` gains `notices.storeUnavailable`; both catalogues get "Personal Task Orchestrator cannot save its own files in your vault, so it has stopped saving changes. It will try again shortly." (the same in en-GB and en-US).
  - Update `api.test.ts` `buildDispatcher` and `settings/operations.test.ts` `buildSettingsDispatcher` to pass `createTestAuditLog(adapters)`. Add an `index.test.ts` case: `tick()` with nothing waiting resolves `{ pendingAuditBatchCount: 0, storeAvailable: true }`.
- **PATTERN**: `packages/core/src/index.ts:131-149`.
- **GOTCHA**: `core/` may not import the settings slice to find the language (`core/README.md`), which is why the host supplies `currentLanguage`. `index.test.ts` still expects exactly three runtime exports: add no new runtime export.
- **VALIDATE**: `pnpm test && pnpm typecheck && pnpm lint`

### Task 8: CREATE the capture slice `packages/core/src/capture/` and register it

- **IMPLEMENT**:
  - `schemas.ts`:
    - `LINE_BREAK_PATTERN`: a regular expression matching any one of these characters: line feed, carriage return, U+000B, U+000C, U+0085, U+2028 and U+2029. Write each with its `\u` escape in the source, never as the character itself, so the source shows what it matches.
    - `CaptureThoughtRequestSchema = z.strictObject({ captureText: z.string().refine((text) => !LINE_BREAK_PATTERN.test(text), { message: 'Capture text may not contain a line break.' }), dueDate: z.iso.date().optional() })`.
    - `CaptureThoughtOutcomeSchema = z.object({ noteId: z.string(), notePath: z.string(), auditLogStatus: z.enum(['written', 'pending', 'not_recorded']) })`.
    - `CAPTURE_INPUT_NO_USABLE_TEXT = 'CAPTURE_INPUT_NO_USABLE_TEXT'`.
  - `rules.ts`:
    - `fileNameFromCaptureText(captureText: string): string`, in this order (Option 4 lines 54-72):
      1. Replace the two non-breaking space characters U+00A0 and U+202F with ordinary spaces, and apply `normalize('NFC')`. Obsidian's own `normalizePath` does both to every path, so doing them here gives the test client the same name as the plugin. The problem definition counts this tidying as a technical limit (owner's ruling, 28 November 2026).
      2. Remove control characters (`\p{Cc}`); the characters Windows refuses, `* " \ / < > : | ?`; and the characters that break Obsidian links, `# ^ [ ]`. They are removed, not replaced.
      3. Remove leading dots, which would hide the file.
      4. Remove trailing spaces and dots, which Windows refuses.
      5. If the name, ignoring case, is `CON`, `PRN`, `AUX`, `NUL`, `COM1`-`COM9` or `LPT1`-`LPT9` (Windows reserved names), add `_`.
      6. Cut the name to at most 247 UTF-8 bytes at a character boundary (with `TextEncoder`), so that the name, a space and a number of up to four digits, and `.md` (8 bytes in all) fit within the 255-byte limit common file systems put on one name. Then remove trailing spaces and dots again.

      Inner runs of spaces and leading spaces are kept.
    - `hasUsableText(captureText)`: `false` when `captureText.trim()` is empty or `fileNameFromCaptureText` returns `''`.
    - `startingFrontMatter({ noteId, captureText, dueDate, moment })` returning, in this key order: `id`, `title` (the text unchanged), `type: 'unclassified'`, `status: ''`, `triage: 'captured'`, `dateCreated` and `dateModified` (both `moment.toISOString()`), and `due` (the date or `''`).
    - `captureAuditEntries({ frontMatter, dueChosen, correlationId, moment })` returning eight entries, one per field in the same order, built with `buildAuditEntry` and `operationName: 'capture'`. Every entry has `a: 'application', m: 'rule'`, except `due` when a date was chosen, which has `a: 'user', m: null` (owner's ruling, 27 November 2026; PRD F8.1). There is no entry for the body.
  - `operations.ts`: `captureThoughtOperation = defineOperation({ name: 'captureThought', version: 1, kind: 'operation', … })`. The handler, split into helpers of under 50 lines:
    1. If `!hasUsableText(captureText)`: log `capture.thought.capture_rejected` with `reason: 'no_usable_text'`, and return `CAPTURE_INPUT_NO_USABLE_TEXT`, not retryable.
    2. If `!(await context.auditLog.checkStore())`: return `CORE_STORE_UNAVAILABLE`, retryable, as the error table in the root `README.md` says.
    3. `automaticChangesOn = await loadAutomaticChangesForThisComputer(context.adapters.settings, context.log)`.
    4. Take `moment = context.adapters.clock.now()` and `noteId = newId()`. Create the note with `vault.create({ title: fileNameFromCaptureText(captureText), frontMatter, body: '' })` inside `try`/`catch`. On a throw, log `capture.thought.note_create_failed` with only `errorName` (never the message, which holds the path), and return `CORE_INTERNAL_ERROR`, not retryable.
    5. If `automaticChangesOn`: `auditLogStatus = await context.auditLog.record(captureAuditEntries(…))`. Otherwise `auditLogStatus` is `'not_recorded'`.
    6. Log `capture.thought.capture_completed` with `noteId`, `auditLogStatus`, `automaticChangesOn` and `fileNameDiffersFromTitle`, and return `{ noteId, notePath, auditLogStatus }`.
  - `index.ts`: `export const captureOperations = [captureThoughtOperation] as const;` and the `CAPTURE_INPUT_NO_USABLE_TEXT` constant.
  - `packages/core/src/index.ts`: `CORE_OPERATIONS = [pingOperation, ...settingsOperations, ...captureOperations]`.
  - Messages:
    - `types.ts`: `KnownErrorCode` gains `'CAPTURE_INPUT_NO_USABLE_TEXT'`.
    - `commands` gains `captureThoughtName: 'Capture a thought'`.
    - A new `capture` group: `boxTitle: 'Capture a thought'`, `textName: 'Thought'`, `dueDateName: 'Due date'`, `saveLabel: 'Save'`, `cancelLabel: 'Cancel'`, `savedNotice: 'Thought captured.'`, `openNoteLabel: 'Open note'`.
    - `errorNotices.CAPTURE_INPUT_NO_USABLE_TEXT: 'Type the thought you want to capture, then save.'`
    - The same words in en-GB and en-US. Update `messages.test.ts` to cover the new code.
  - The slice's `README.md`: flows, rules (usable text, file name, starting fields, audit entries and who each names, automatic changes off), the log events, and "Features touched: settings (reads the per-computer setting through `settings/index.ts`)". Using the `/drafting:seamless-edit` command, add the matching line to `settings/README.md` under "Features touched". The capture slice's `README.md` is a new file, so it is written directly, in the layout of `settings/README.md`.
  - Tests (`rules.test.ts`, and `operations.test.ts` over `createTestAdapters` and a dispatcher with `createTestAuditLog`, with the pretend clock at `2026-01-01T09:00:00.000Z`):
    - fields, empty body, key order and file name for "Call the accountant";
    - each limited character; a leading dot; a trailing space and a trailing dot; "CON"; a 300-character text (name at most 247 bytes, title unchanged); "a/b" gives "ab";
    - " Call " keeps both spaces in `title`, and the file name is " Call";
    - a due date given gives `due` and a `due` entry with `a: 'user', m: null`; no due date gives `due: ''` and `a: 'application'`;
    - eight entries, each `c` equal to the result's `correlationId` and to the log lines' `correlationId`; every `e` and `c` a ULID; the `title` entry has `a: 'application'`;
    - `computerValues.set('automaticChanges', false)`: the note is created, no audit file, `auditLogStatus: 'not_recorded'`;
    - store `failingAppendCount: 1`: the note is created and the status is `'pending'`; `core.tick()` then writes each entry once;
    - store `unreadable: true`: `CORE_STORE_UNAVAILABLE` and no note;
    - `''`, `'   '` and `'///'`: `CAPTURE_INPUT_NO_USABLE_TEXT`, no note, no audit file;
    - a missing `captureText`, `captureText: 42`, a text holding a line feed, an unknown key, and `dueDate: '2026-02-30'`: `CORE_INPUT_INVALID` and no note;
    - a vault whose `create` rejects with a message containing the text: `CORE_INTERNAL_ERROR`, and no log line contains the text;
    - a refused request writes exactly one `core.api.request_rejected` line and no start line;
    - in every case, no log line contains the captured text.
- **PATTERN**: `packages/core/src/settings/` (whole slice); `settings/operations.test.ts:15-40`.
- **IMPORTS**: `import { loadAutomaticChangesForThisComputer } from '../settings/index.ts';` (allowed: another slice's `index.ts`); `newId` from `../core/ids.ts`; `buildAuditEntry` from `../core/audit/entries.ts`.
- **GOTCHA**: The line-break check lives in the schema, so it gives `CORE_INPUT_INVALID` (owner's ruling); the usable-text check lives in the handler, because it depends on the file-name rule. Empty values are `''`, never `null`: `FrontMatterValue` cannot hold `null`, and both adapters drop it when reading. `fileNameFromCaptureText` must be pure, so the test client and the plugin get the same name.
- **VALIDATE**: `pnpm vitest run --project core && pnpm lint && pnpm typecheck`

### Task 9: UPDATE the test client to stop changing names and to use ULID correlation IDs

- **IMPLEMENT**:
  - `file-vault-adapter.ts`: `createNote` and `renameNote` use the title as given (remove the `sanitiseTitle` calls at lines 108 and 173); `freeFilePath` still adds ` 2`, ` 3`. Add to the file's list of deliberate differences (lines 4-9): "names are not changed: the core decides them".
  - `note-file.ts`: remove `sanitiseTitle` and `FORBIDDEN_TITLE_CHARACTERS`.
  - `cli.ts`: stop passing `randomUUID()`, and send the request without a `correlationId`. When `execute` answers with the `kind_mismatch` error (the name is a query, not an operation), send the request again through `query` with `correlationId: result.correlationId`, so both attempts share one ID. Remove the `node:crypto` import.
  - `index.ts`: pass `{ minimumLogLevel, currentLanguage: () => 'en-GB' }` to `createCore`.
  - Update `adapters.test.ts` (the rename case at lines 93-95 now expects the title as given, so use a clean title such as `'Renamed note'`) and `cli.test.ts` (the correlation-ID test still holds).
- **GOTCHA**: Make this change only after Task 8, so the core owns the name rule.
- **VALIDATE**: `pnpm vitest run --project test-client && pnpm typecheck`

### Task 10: UPDATE the plugin vault adapter: no name changes, case-aware taken check, active folder, clean-up

- **IMPLEMENT**:
  - Move `createNote` and `freeNotePath` into `adapters/note-creation.ts`, exported with TSDoc, keeping `vault-adapter.ts` under 300 lines.
  - `VaultAdapterHost` gains `readonly dataAdapter: Pick<DataAdapter, 'exists'>` and `activeFilePath(): string`; `adapters/index.ts` supplies `app.vault.adapter` and `() => app.workspace.getActiveFile()?.path ?? ''`.
  - `freeNotePath` no longer changes the title (remove `FORBIDDEN_TITLE_CHARACTERS`). It builds `normalizePath(`${folderPath}/${candidateTitle}.md`)` and checks `await host.dataAdapter.exists(candidatePath)`, which follows the file system's case rules, so it becomes `async`.
  - `createNote` calls `host.fileManager.getNewFileParent(host.activeFilePath())`. If `processFrontMatter` throws after `vault.create`, it moves the new file to the trash with `host.fileManager.trashFile(file)` (in its own `try`/`catch`) and re-throws the original error.
  - `renameNote` uses the title as given.
  - Update `vault-adapter.test.ts`: the fake host gains `dataAdapter.exists` and `activeFilePath`. Cases: the title is used as given (replace the "Idea: one" case with a clean title); a taken name that differs only in case gets " 2"; the active file's path reaches `getNewFileParent`; a failing `processFrontMatter` trashes the new file and the error reaches the caller.
- **PATTERN**: `vault-adapter.ts:219-248`.
- **GOTCHA**: Keep the two-step create (`vault.create` with the empty body, then `processFrontMatter`): CLAUDE.md allows front matter to be written only through `processFrontMatter`. Use `instanceof TFile`, never a cast.
- **VALIDATE**: `pnpm vitest run --project plugin && pnpm typecheck && pnpm lint`

### Task 11: CREATE the capture box `packages/plugin/src/modals/`

- **IMPLEMENT**:
  - `capture-submission.ts`: `submitCapture(core: Core, captureInput: { readonly captureText: string; readonly dueDate: string }): Promise<CaptureSubmission>`, where `CaptureSubmission` is `{ kind: 'saved'; notePath: string } | { kind: 'ask_for_text'; message: string } | { kind: 'failed'; message: string }`.
    - It sends `captureThought` version 1 with `actor: 'user'`, leaving out `dueDate` when it is `''`.
    - `CAPTURE_INPUT_NO_USABLE_TEXT` gives `ask_for_text` with that code's wording.
    - Any other failure gives `failed` with the wording `noticeForError` picks (`notices.ts:16-18`).
    - A rejected `execute` gives `failed` with `operationFailed('CORE_INTERNAL_ERROR')`, the catalogue's general failure wording, and logs `plugin.capture.submit_failed`.
  - `capture-modal.ts`: `CaptureModal extends Modal`, built from `app`, `core` and `getMessages`:
    - `onOpen`: the title from `capture.boxTitle`; a single-line `<input type="text">` labelled `capture.textName` (class `task-orchestrator-capture-text`), focused; an `<input type="date">` labelled `capture.dueDateName` (class `task-orchestrator-capture-due`); a message area with `aria-live="polite"` (class `task-orchestrator-capture-message`); Save (`setCta()`) and Cancel buttons.
    - Enter in the text field submits (`this.scope.register([], 'Enter', …)` returning `false`); Cancel and Escape close the box.
    - While a submission is in progress, Save is disabled and a second submit is ignored.
    - `saved`: close the box, then show a `Notice` built as a `DocumentFragment`: `capture.savedNotice`, followed by a link labelled `capture.openNoteLabel` whose click calls `app.workspace.openLinkText(notePath, '', false)` inside `try`/`catch`.
    - `ask_for_text` and `failed`: keep the box open with the typed text, and put the message in the message area (`setText`).
  - `styles.css`: classes for the three elements; no inline styles.
  - `capture-submission.test.ts`, with a stub `Core` whose `execute` returns canned results (as `commands.test.ts:51-66` does): saved; `CAPTURE_INPUT_NO_USABLE_TEXT`; `CORE_STORE_UNAVAILABLE` wording; a rejected `execute`; the request has no `dueDate` key for `''` and has it for `'2026-12-01'`.
- **PATTERN**: `commands.ts:47-57` (run an operation, pick the wording); `notices.ts:16-18`.
- **GOTCHA**: No `innerHTML` (use `createEl`, `createDiv`, `setText`); sentence case for every word shown (`obsidianmd` rules); every handler catches its own errors and no promise is left unhandled (`void promise.catch(…)`). The plugin unit tests run in Node without a page, so the drawing code is proven in Task 15, not in unit tests. A single-line input strips line breaks from pasted text, as the HTML standard requires.
- **VALIDATE**: `pnpm vitest run --project plugin && pnpm lint && pnpm typecheck`

### Task 12: ADD the command and the scheduler, and UPDATE `main.ts`

- **IMPLEMENT**:
  - `commands.ts`: `registerCommands` also takes the `App` and registers `{ id: 'capture-thought', name: getMessages().commands.captureThoughtName, callback }`, with no default hotkey. The callback opens `new CaptureModal(app, core, getMessages)`, catches errors and logs `plugin.command.capture_failed`.
  - `scheduler.ts`: `startScheduler(componentHost: Pick<Plugin, 'registerInterval'>, core: Core): void` registers `window.setInterval(() => { void core.tick().catch((thrown: unknown) => { core.logger.error('plugin.scheduler.tick_failed', { thrownError: describeError(thrown) }); }); }, TICK_INTERVAL_MILLISECONDS)`, with `TICK_INTERVAL_MILLISECONDS = 15_000` (TAD 2.4). `describeError` is the plugin's own function in `notices.ts:26-30`.
  - `main.ts`: pass `{ minimumLogLevel: 'debug', currentLanguage: () => this.settings.language }` to `createCore`; pass `this.app` to `registerCommands`; call `startScheduler(this, core)` inside the existing `onLayoutReady` callback. Lifecycle only, no logic.
  - Tests: `commands.test.ts` registers two commands (`ping` and `capture-thought`), neither with hotkeys. `scheduler.test.ts`, with `vi.useFakeTimers()`: after 15 seconds `tick` has been called once; a rejecting `tick` logs `plugin.scheduler.tick_failed` and does not throw.
- **PATTERN**: `commands.ts:25-36`; `main.ts:81-83`.
- **GOTCHA**: Use `window.setInterval`, not the global `setInterval` (`obsidianmd/prefer-window-timers`). In the test, make `window` available on `globalThis` for the Node environment if the stand-in lacks it, without a suppression comment. Change `__mocks__/obsidian.ts` only with what the tests touch (for example `Modal` gaining `contentEl` and `scope`, if a test needs them).
- **VALIDATE**: `pnpm vitest run --project plugin && pnpm lint && pnpm typecheck && pnpm build`

### Task 13: CHECK that every test stand-in implements the new port functions

- **IMPLEMENT**: Confirm that `createTestAdapters`, `createFakeCore` and the test client's `createTestClient` implement every port function (the type check proves it), and that `core/testing/index.ts` exports `createTestAuditLog` and the new store switches. Change nothing unless the check fails.
- **VALIDATE**: `pnpm typecheck && pnpm test`

### Task 14: CREATE the test-client comparison helper and scenario tests

- **IMPLEMENT**:
  - `comparison/blank-generated-values.ts`, pure, importing nothing from other packages:
    - `blankNoteFields(frontMatter)` replaces the values of `id`, `dateCreated` and `dateModified` with `'<generated>'`.
    - `blankAuditEntries(entries)` replaces `e`, `t`, `n` and `c`, and the `v` of the `id`, `dateCreated` and `dateModified` entries, with `'<generated>'`, and sorts the entries by `f`.
    - Test both.
  - `capture-scenario.test.ts`, in its own file so `scenario.test.ts` stays small, through `createTestClient` on `copyFixtureVault()`:
    - "Call the accountant": the note file `Call the accountant.md`, its fields, an empty body, and `audit/<month>.jsonl` with eight lines sharing the result's correlation ID;
    - a second identical capture gets `Call the accountant 2.md`;
    - `'What now?'` gives `What now.md` with `title: 'What now?'`; a 300-character text; `' Call '` keeps its spaces in `title`;
    - `dueDate: '2026-12-01'`, and no due date;
    - the per-computer file holding `{ "automaticChanges": false }`: the note is created and no audit file is written;
    - `''`, `'   '`, `'///'` and a text holding a line feed: refused, no note, no audit file;
    - `.task-orchestrator` replaced by a plain file: `CORE_STORE_UNAVAILABLE` and no note;
    - titles `'123'` and `'true'` read back as strings.
- **PATTERN**: `scenario.test.ts`; `adapters.test.ts:10-21`.
- **VALIDATE**: `pnpm vitest run --project test-client`

### Task 15: CREATE `e2e-tests/capture.e2e.ts`

- **IMPLEMENT**: With `beforeEach(obsidianPage.resetVault)`, at the earliest and latest Obsidian versions:
  - `executeObsidianCommand('task-orchestrator:capture-thought')` opens the box. Type "Call the accountant" into `.task-orchestrator-capture-text` and click Save. A `.notice` contains `capture.savedNotice`, and clicking its link opens the note.
  - Read the note's fields through `app.metadataCache.getFileCache(file)?.frontmatter`, Obsidian's own record of a note's fields: every starting field is present, `status` and `due` equal `''`, and `title` is exact.
  - A second capture gets "Call the accountant 2.md"; "What now?" gives "What now.md"; `' Call '` keeps its spaces in `title`; `'123'` and `'true'` read back as strings.
  - `'Call '` (a trailing space) creates `Call.md`, with `title` `'Call '`. This tests whether the name needs its trailing space removed; see Notes.
  - `''` and `'///'` keep the box open with the `CAPTURE_INPUT_NO_USABLE_TEXT` wording and create no note.
  - `app.saveLocalStorage('task-orchestrator:automaticChanges', false)`: a capture writes no audit line for its note ID. Clear the value afterwards with `saveLocalStorage(key, null)` in `finally`.
  - Comparison: capture "Call the accountant" in Obsidian. Run `createTestClient` (imported by relative path from `../packages/test-client/src/index.ts`) on a fresh `copyFixtureVault()` with the same payload. Compare `blankNoteFields` of both notes, and `blankAuditEntries` of both notes' audit lines (filtered by note ID; read through `app.vault.adapter.read` and from disk). Remove the copy in `finally`.
- **PATTERN**: `e2e-tests/smoke.e2e.ts` (whole file).
- **GOTCHA**: Filter audit lines by note ID, because the store may outlive `resetVault`. If importing the test client into the WebdriverIO test process fails to resolve its packages, run `packages/test-client/src/cli.ts` through `spawnSync(process.execPath, …)` instead and read its JSON result (Option 4, lines 549-552).
- **VALIDATE**: `pnpm e2e`

### Task 16: UPDATE the documents

- **IMPLEMENT** (make every edit below by invoking the `/drafting:seamless-edit` command):
  - `README.md`:
    - the `captureThought` section gets its payload, `{ "captureText": "Call the accountant", "dueDate": "2026-12-01" }`, and its outcome, `{ noteId, notePath, auditLogStatus }`;
    - "Only `ping`, `settings` and `updateSettings` are built so far" adds `captureThought`;
    - the error table gains `CAPTURE_INPUT_NO_USABLE_TEXT`, with Retryable "No" and the meaning "The capture has no text that can become a note";
    - the Configuration section says the automatic-changes value is kept on each computer, in Obsidian's per-vault storage.
  - `CLAUDE.md`:
    - Section 2: the Database bullet adds the per-computer storage, and the tech stack names `ulid`;
    - Section 3: the tree adds `core/audit/`, and says `settings` and `capture` exist;
    - Section 5: correlation IDs are ULIDs from `newCorrelationId()`;
    - Section 8: rows for a modal (`packages/plugin/src/modals/capture-modal.ts`), the audit writer (`packages/core/src/core/audit/audit-log.ts`) and the scheduler tick (`packages/plugin/src/scheduler.ts`).
  - `packages/core/src/core/README.md`: a table row for `audit/`.
- **VALIDATE**: `pnpm format:check`

### Task 17: RUN the full checks

- **IMPLEMENT**: Run the suppression search, `git grep -nE "eslint-(disable|enable)|/\* *eslint |@ts-" -- '*.ts' '*.mts'`, and confirm every hit carries a same-line reason. Then run every command under VALIDATION COMMANDS.
- **VALIDATE**: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm check:size && pnpm check:manifest && pnpm e2e`

---

## TESTING STRATEGY

### Unit Tests

Core tests use only `core/testing/` stand-ins and a pretend clock (CLAUDE.md Section 6): the per-computer loader (Task 5), the audit writer (Task 6), the dispatcher and `tick()` (Task 7), the capture rules and operation (Task 8). Plugin tests run against the stand-in for Obsidian: the adapters (Tasks 4 and 10), the submission logic (Task 11), the command and the scheduler (Task 12). The core's 80% line-coverage threshold must still pass.

### Integration Tests

Test-client scenario tests against a temporary copy of `test-vault/` (Task 14), and real-Obsidian tests at the earliest and latest versions, including the comparison with the test client (Task 15).

### Edge Cases

- `''`, `'   '`, `'///'`; a line break of every kind; an unknown key; an impossible date such as `2026-02-30`.
- Every limited character; a leading dot; a trailing space or dot; a Windows reserved name; 300 characters; inner and leading spaces kept.
- A taken name, including one that differs only in case.
- Titles that look like a number, `true` or a date.
- Automatic changes off, never set, or holding an unexpected value.
- An append that fails before writing, and one that fails after writing; a half-written last line; three failures in a row; recovery with and without a waiting batch.
- An unreadable store before the capture.
- A vault `create` that throws with the path in its message.
- A second Save pressed while the first is in progress.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
pnpm lint && pnpm format:check
pnpm typecheck
```

### Level 2: Unit Tests

```bash
pnpm test
```

### Level 3: Integration Tests

```bash
pnpm e2e
```

### Level 4: Manual Validation

```bash
VAULT_COPY="$(mktemp -d)" && cp -R test-vault/. "$VAULT_COPY" && node packages/test-client/src/cli.ts "$VAULT_COPY" captureThought '{"captureText":"Call the accountant","dueDate":"2026-12-01"}' --config-folder .obsidian
cat "$VAULT_COPY/Call the accountant.md" && cat "$VAULT_COPY"/.task-orchestrator/audit/*.jsonl
```

Expect exit code 0; the note with its eight fields and an empty body; and eight audit lines whose `c` equals the printed `correlationId`, with the `due` line naming `"a":"user"`. Then run `pnpm dev`, open `test-vault/` in Obsidian, run "Capture a thought", save a thought, follow the notice's link, and confirm that the developer console shows no errors.

### Level 5: Additional Validation (Optional)

```bash
pnpm build && pnpm check:size && pnpm check:manifest
```

---

## ACCEPTANCE CRITERIA

Every "Done means" item of the problem definition passes, each proven by the tests named:

- [ ] The box opens from a command, takes one line, and saving shows a notice linking to the note (Task 15).
- [ ] "Call the accountant" creates one note with the starting fields, `title` exact, and an empty body (Tasks 8, 14 and 15).
- [ ] The file name is "Call the accountant", with a number added only when taken (Tasks 14 and 15).
- [ ] A text with a limited character or length gets a file name that differs only where the limit requires, and `title` keeps the text (Tasks 8, 14 and 15).
- [ ] `title` keeps spaces at either end (Tasks 8, 14 and 15).
- [ ] `due` holds a chosen date as `YYYY-MM-DD`, or is present and empty (Tasks 8, 14 and 15).
- [ ] One audit entry per field set, all carrying the capture's correlation ID (Tasks 8 and 14).
- [ ] Every audit entry ID and correlation ID is a ULID (Tasks 3 and 8).
- [ ] No audit entry names the user as last to set the title or the body; a chosen due date names the user (Task 8).
- [ ] With automatic changes off, the note is created and no audit entry is written (Tasks 8, 14 and 15).
- [ ] With automatic changes never set, a capture behaves as with it on (Tasks 5 and 8).
- [ ] The test client gives the same fields and entries, apart from generated values (Task 15).
- [ ] After a failed audit write, the note stays, the user sees the usual confirmation, and a retry writes each entry once (Tasks 6 and 8).
- [ ] After 3 store failures in a row, writes stop and one notice is shown (Task 6).
- [ ] Empty, whitespace-only and "///" captures create nothing, write nothing and ask for text (Tasks 8, 14 and 15).
- [ ] A malformed request is refused with `CORE_INPUT_INVALID` and writes nothing (Tasks 8 and 14).
- [ ] An unreadable store refuses the capture before anything is written (Tasks 8 and 14).
- [ ] A capture that passes the request check writes a start line and a completion or failure line; a refused request writes one "request rejected" line; no line holds note content (Task 8).

Also:

- [ ] All validation commands pass with zero errors.
- [ ] Core line coverage stays at or above 80%.
- [ ] No file passes 300 lines and no function 50.
- [ ] README.md, CLAUDE.md, NOTICES.md and the slice READMEs describe the repository as it is.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability

---

## NOTES

- **Departure from Option 4.** Option 4 records every capture entry as the application's. The owner ruled on 27 November 2026 that a chosen due date is the user's decision (PRD F8.1), so Task 8 records that one entry with `a: 'user'` and `m: null`. Nothing else in Option 4 changes.
- **Assumptions carried from Option 4 that the owner has not ruled on:**
  - "keeps failing" means 3 store failures in a row;
  - a missing store folder counts as readable until first-run setup exists.
- **Owner's later rulings.** On 28 November 2026 the owner ruled that, with automatic changes off, application log lines are still written; that a refused request writes one "request rejected" line instead of a start line; and that Obsidian's own path tidying counts as a technical limit, which covers step 1 of Task 8's file-name rule. The owner also decided, on 27 November 2026, to keep Option 4's retry through `Core.tick()`, which finishes the capture's own record and so has no named operation of its own.
- **Departures from the TAD**, each explained in Option 4:
  - TAD 2.2 writes `core.tick(now)`; `Core.tick()` reads the time from the clock port instead.
  - TAD 3.2 lists four settings-port functions; this plan adds only `loadForThisComputer`, because saving belongs to the control, which is out of scope. It also adds `appendLines`, which TAD 3.2 omits.
  - TAD 2.6 plans a capture box copied from another plugin, with a multi-line text area; the owner's single-line ruling leaves little to reuse, so the box is written from scratch.
  - TAD 3.3 shows `t` without milliseconds and has every operation refused at the first store failure; here `t` keeps milliseconds, and only the capture is refused, after 3 failures in a row.
- **Facts not yet checked against the running software, and the test that checks each:**
  - Obsidian writes `''` so that it reads back as `''`, and quotes titles that look like numbers or `true` (Task 15).
  - The `ulid` browser build bundles without Node modules (`pnpm build` in Task 12, and `pnpm check:size` in Task 17).
  - Windows refuses file names ending in a space. Option 4 read this in Obsidian 1.13.7's file-name validator; Option 2, another of the four options the evaluation compared, read Obsidian 1.15.0's and disagrees. Task 15's `'Call '` case shows what the minimum and latest Obsidian do; if both accept the trailing space, drop the removal of trailing spaces from steps 4 and 6 of Task 8's rule.
- **Trade-offs:**
  - Waiting audit entries are lost if Obsidian closes before a retry; the problem definition defers recovering them.
  - While the store is unavailable, captures are refused. PRD 3.0.5 says that when the store cannot be read, the core stops writing and tells the user; PRD 4.4 says nothing should block the user from capturing. This plan follows 3.0.5, as Option 4 does.

Confidence for one-pass success: 7/10. The risks are the real-Obsidian details in Task 15 (how Obsidian writes `''`, and importing the test client into the WebdriverIO test process) and the size of the change.
