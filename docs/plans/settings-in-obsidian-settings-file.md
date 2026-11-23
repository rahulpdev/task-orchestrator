# Feature: Settings in Obsidian's settings file

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

The user's settings move out of `.task-orchestrator/settings.json`, a file in the plugin's local store (the folder of plugin-owned files at the top of the vault). They move into the file Obsidian keeps for each plugin's settings, `<vault>/.obsidian/plugins/task-orchestrator/data.json`.

The application core (the part of the code that holds every rule) never uses Obsidian's own code. It reaches outside files only through ports: interfaces the core declares and each host fills in with an adapter. The plugin is one host; the command-line test client is the other. This plan adds a settings port with an adapter for each host.

The `settings` query (which reads the settings) and the `updateSettings` operation (which changes them) keep their names, versions, input fields and success results. Their failure results change, as Task 3 sets out. Only where the settings are kept changes, along with the documents that say where they are kept.

## User Story

As the owner of the plugin
I want the settings kept where the PRD (the product requirements document, `docs/PRD.md`) and the TAD (the technical architecture document, `docs/TAD.md`) now put them
So that the code, the TAD and CLAUDE.md agree, and later features can build on the right storage: one computer per vault making the changes the application works out itself, the record of the last licence check, and the record of date alerts already shown

## Problem Statement

The PRD's requirement on where settings are kept (F14.3) and the TAD's section on configuration (8.4), both updated on 23 November 2026, say settings are kept in Obsidian's own settings file for the plugin. The TAD's table of ports (section 3.2) says the core reaches that file through a settings port. The code, the README of the settings slice (the folder `packages/core/src/settings/`, which holds the settings feature's rules, operations and tests), README.md and CLAUDE.md Section 2 still say settings live in `.task-orchestrator/settings.json` and that `data.json` is not used.

## Solution Statement

Add a `SettingsPort` with two functions, `load()` and `save(settings)`. The plugin's adapter calls Obsidian's `loadData` and `saveData`. The test client's adapter reads and writes the same `data.json` path inside the vault folder, so the plugin and the test client see the same settings.

The settings slice switches from the store port to the settings port and keeps every rule it follows on 23 November 2026. It fills in defaults, keeps saved settings it does not recognise, refuses to overwrite a damaged settings file, and runs migrations (named steps that upgrade settings saved by an earlier version). The refusal to overwrite holds in the core's tests. In a real Obsidian it is unconfirmed until Task 6 shows how `loadData` treats a file that is not valid JSON.

Then correct the settings slice's README, README.md and CLAUDE.md Section 2.

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Low
**Primary Systems Affected**: `core/core/ports.ts`, the settings slice, plugin adapters, test-client adapters, the real-Obsidian smoke test, README.md, CLAUDE.md
**Dependencies**: None new

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `packages/core/src/core/ports.ts` (lines 148-190 `StorePort`, 257-265 `CoreAdapters`, 267-299 `frontMatterValuesEqual`) - Why: the port to add, and the 300-line file limit it would break
- `packages/core/src/core/testing/in-memory-store.ts`, `testing/index.ts` - Why: the pattern for the in-memory settings adapter and for `createTestAdapters`, which builds one test adapter per port
- `packages/core/src/settings/` (all files) - Why: the slice to switch over; `operations.ts` lines 33-122 hold the logic that changes
- `packages/core/src/index.ts` (lines 17-40) - Why: the core's public exports; `SettingsPort` must be exported as a type
- `packages/plugin/src/adapters/index.ts`, `store-adapter.ts`, `secrets-adapter.ts` - Why: adapter wiring and the reference adapter pattern
- `packages/plugin/src/main.ts` (lines 18, 50-60, 84-97) - Why: comments that name `settings.json`, and `onExternalSettingsChange`
- `packages/plugin/src/settings/settings-state.ts` (lines 1-5) and `settings-state.test.ts` - Why: a comment and tests that use `settings.json`
- `packages/plugin/src/test-helpers/fake-core.ts` (lines 55-90) - Why: the plugin tests' hand-built adapters; it needs a settings stand-in
- `packages/test-client/src/index.ts`, `adapters/file-store-adapter.ts`, `adapters/note-file.ts` (`writeFileAtomically`) - Why: test-client wiring and the file pattern to mirror
- `packages/test-client/src/cli.test.ts` (lines 48-56) and `scenario.test.ts` (lines 30-45) - Why: assertions that read `.task-orchestrator/settings.json`
- `packages/test-client/src/adapters/adapters.test.ts` - Why: where the new test-client adapter's tests go
- `e2e-tests/smoke.e2e.ts` (lines 128-145) - Why: the real-Obsidian check that reads `settings.json`
- `docs/TAD.md`: decision E19 (three facts about each computer are kept in Obsidian's storage for that computer), the section 3.2 port table row "Settings port", and the section 8.4 "Plugin" and "Core" bullets - Why: the design being implemented
- `docs/PRD.md`: F14.3 (where settings are kept) and F10.1 (export), which says an export holds the settings and leaves out the licence key - Why: requirements the design serves

### New Files to Create

- `packages/core/src/core/front-matter-values.ts` - the function that checks whether two front-matter values (the fields at the top of a note) are equal, with its helpers, moved out of `ports.ts`
- `packages/core/src/core/front-matter-values.test.ts` - its existing tests, moved from `ports.test.ts`
- `packages/core/src/core/testing/in-memory-settings.ts` - in-memory settings adapter
- `packages/plugin/src/adapters/settings-adapter.ts` and `settings-adapter.test.ts`
- `packages/test-client/src/adapters/file-settings-adapter.ts`

### Relevant Documentation

Tasks are numbered in the order they appear under STEP-BY-STEP TASKS.

- `obsidian.d.ts` 1.14.4, `Plugin.loadData` (since 0.9.7): returns the saved data, or `null` if nothing has been saved yet. `Plugin.saveData(data)` (since 0.9.7) writes `data.json` in the plugin folder. Used by Task 4.
- `.agents/reference/obsidian-community-plugin-development.md` lines 244 and 349: `onExternalSettingsChange` runs when a sync tool changes `data.json`; tolerate a half-written `data.json` rather than overwriting it. Used by Tasks 3 and 4.
- The type definitions do not say what `loadData` does when `data.json` holds text that is not JSON. Task 6 finds out in a real Obsidian.

### Patterns to Follow

- **Adapter:** `createObsidianStoreAdapter(app.vault.adapter)` in `store-adapter.ts`: a `create…Adapter` function that takes only the host objects it needs and returns the port.
- **Returned AppError:** `createAppError(SETTINGS_FILE_UNREADABLE, '…', false)` in `settings/operations.ts`.
- **Logging:** `context.log.warn('settings.file.load_rejected', { … })`. Events keep their `settings.file.*` names. Drop the `settingsPath` field, which named the store path.
- **`any` from Obsidian:** assign `loadData()`'s result to a variable typed `unknown` before using it, so the type-checked lint rules pass with no suppression comment.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

Make room in `ports.ts`, then add the port and its in-memory adapter (Tasks 1 and 2).

### Phase 2: Core Implementation

Switch the settings slice to the port (Task 3).

### Phase 3: Integration

Add the plugin and test-client adapters, wire them in and update their tests (Tasks 4 and 5).

### Phase 4: Real-Obsidian check and documents

Check in a real Obsidian how `loadData` behaves when `data.json` holds text that is not JSON, then correct the three documents (Tasks 6 and 7).

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable, with one exception: after Task 2 the type check fails in the plugin, the test client and the plugin's fake core until Tasks 4 and 5 add their settings adapters.

### Task 1: REFACTOR packages/core/src/core/front-matter-values.ts

- **IMPLEMENT**:
  - Adding the settings port in Task 2 would take `ports.ts` past the 300-line file limit in CLAUDE.md Section 4. To make room, move the front-matter comparison code into the new file unchanged: `frontMatterValuesEqual` and its helpers `stableJson` and `isFrontMatterArray` (ports.ts lines 267-299).
  - Move `ports.test.ts` to `front-matter-values.test.ts`.
  - Update the imports in `core/testing/in-memory-vault.ts` (line 7) and `packages/core/src/index.ts` (line 20). The public export name stays the same, so `index.test.ts` and the plugin and test-client imports need no change.
- **VALIDATE**: `pnpm typecheck && pnpm test`

### Task 2: ADD SettingsPort and its in-memory adapter

- **IMPLEMENT**:
  - In `ports.ts`, add `export interface SettingsPort { load(): Promise<unknown>; save(settings: Readonly<Record<string, unknown>>): Promise<void>; }`. In its TSDoc, say that `load` returns the saved value, returns `null` when nothing has been saved, and may throw when the file cannot be read, and that `save` replaces the whole saved value.
  - Add `readonly settings: SettingsPort;` to `CoreAdapters`.
  - Export the type from `packages/core/src/index.ts`.
  - Create `testing/in-memory-settings.ts` exporting `createInMemorySettings(initialValue: unknown = null)`. It returns a `SettingsPort` plus a mutable `savedValue` field for assertions.
  - Export it from `testing/index.ts`, and add `settings: createInMemorySettings()` to `createTestAdapters`.
- **PATTERN**: `testing/in-memory-store.ts`
- **GOTCHA**: The TAD's port also has `loadForThisComputer` and `saveForThisComputer`. Leave them out. The first feature that stores a value separately for each computer adds them. CLAUDE.md Section 1 (YAGNI, "You aren't gonna need it") says to build nothing before it is needed.
- **VALIDATE**: `pnpm vitest run --project core`. `pnpm typecheck` is expected to fail where adapters are built for the plugin, the test client and the fake core, until Tasks 4 and 5.

### Task 3: UPDATE packages/core/src/settings/ to use the settings port in place of the store port

- **IMPLEMENT**:
  - `schemas.ts`: remove `SETTINGS_STORE_PATH`, the store path of the old file. Change the file's TSDoc to say the settings are saved through the settings port.
  - `rules.ts`: replace `parseSettingsFile(fileContents: string)` with `parseSavedSettings(savedValue: unknown)`. It returns the load status `corrupt` when the value is not an object, is an array, or does not match `UserSettingsSchema` in `schemas.ts`, and the load status `valid` otherwise. `loadSettings` in `operations.ts` handles `null` itself.
  - `operations.ts`, `loadSettings`: call `context.adapters.settings.load()`.
    - `null` gives the default settings and the load status `defaulted`.
    - If `load` throws, log `settings.file.read_failed` with `thrownError: describeThrown(thrown)` (the existing helper that turns a thrown value into loggable text). Then return a failed result with `SETTINGS_FILE_UNREADABLE` and `retryable: false`. `retryable` tells the caller whether the same request may succeed if tried again unchanged. A settings file that cannot be read is not expected to fix itself, and an update must not overwrite it.
    - Otherwise parse the value, log `settings.file.load_rejected` when it is `corrupt`, and run the existing migrations without changing them.
  - `updateSettings`: call `context.adapters.settings.save(merged)`. If `save` throws, log `settings.file.write_failed` and return a failed result with `CORE_ERROR_CODES.internalError` (`CORE_INTERNAL_ERROR`) and `retryable: false`, as every other internal error in the core is (`internalError` in `core/api.ts`) and as README.md's error-code table states.
  - Remove `storeFailure`, the function that turns a store failure into a failed result, because the slice no longer uses the store port.
  - Update `rules.test.ts` and `operations.test.ts` to seed and check settings through `createInMemorySettings`. Cover these cases:
    - nothing saved
    - a valid value
    - a value that is not an object
    - an array
    - a field of the wrong type
    - an unrecognised key kept on save
    - a load that throws
    - a save that throws
    - a damaged value left unchanged by `updateSettings`
- **GOTCHA**: `CORE_STORE_UNAVAILABLE` is no longer a settings outcome. The query's and the operation's success results are unchanged, so the plugin's settings tab needs no change.
- **VALIDATE**: `pnpm vitest run --project core`

### Task 4: CREATE packages/plugin/src/adapters/settings-adapter.ts

- **IMPLEMENT**:
  - Write `createObsidianSettingsAdapter(pluginData: Pick<Plugin, 'loadData' | 'saveData'>): SettingsPort`. `load` does `const savedValue: unknown = await pluginData.loadData(); return savedValue;`. `save` passes the value to `saveData`.
  - In `adapters/index.ts`, add `settings: createObsidianSettingsAdapter(plugin)`, and change "six adapters" to "seven adapters" in the TSDoc.
  - Add `settings-adapter.test.ts`, passing a plain object with `loadData` and `saveData`. The `Plugin` stand-in in `__mocks__/obsidian.ts` needs no change.
  - `main.ts` line 18: change the comment to say settings are saved through the core to Obsidian's settings file.
  - `main.ts` lines 84-90: `onExternalSettingsChange` is the function Obsidian calls when a sync tool changes `data.json`. Remove the `settings.json` sentence from its TSDoc, and say it reloads the settings that changed.
  - `settings/settings-state.ts` lines 1-5: replace the `data.json` sentence with one saying settings are read and saved only through the core.
  - `test-helpers/fake-core.ts`: add an option `savedSettings?: unknown`, and a `settings` stand-in that holds that value and lets the tests read it back.
  - `settings-state.test.ts`: seed through `savedSettings` in place of `storeFiles['settings.json']`. Use an object for valid settings and a string for damaged ones.
- **GOTCHA**: The plugin may not import the core's `testing/` folder, which is why `fake-core.ts` builds its own stand-ins. The settings stand-in follows the same pattern.
- **VALIDATE**: `pnpm vitest run --project plugin`

### Task 5: CREATE packages/test-client/src/adapters/file-settings-adapter.ts

- **IMPLEMENT**:
  - Write `createFileSettingsAdapter(vaultPath: string, configFolderName: string): SettingsPort` over `<vault>/<configFolderName>/plugins/task-orchestrator/data.json`. The config folder is where Obsidian keeps its settings, `.obsidian` unless the user renamed it, and `task-orchestrator` is the plugin's `id` in `manifest.json`. The test client runs without Obsidian, so it cannot ask for the folder's name: the caller supplies it. The adapter refuses a name that is empty, `.`, `..` or contains a path separator.
  - Make `configFolderName` a required option of `createTestClient`, and add a required `--config-folder <name>` option to the command line in `cli.ts`, which exits 2 with usage when it is missing or not a single folder name. Pass `--config-folder .obsidian` in the README's and CLAUDE.md's test-client commands and in `.claude/commands/validate/validate.md`.
  - `load`: a missing file gives `null`. Otherwise it returns `JSON.parse` of the text and lets a parse error throw.
  - `save`: write `JSON.stringify(settings, null, '\t')` and a trailing newline with `writeFileAtomically` from `note-file.ts`, which writes to a temporary file and renames it, so a failure part-way never leaves a half-written file.
  - Add the adapter to the test client's adapters in `packages/test-client/src/index.ts`.
  - In `adapters.test.ts`, add tests for a missing file, a save read back, and text that is not JSON.
  - Change `cli.test.ts` (lines 52-55) and `scenario.test.ts` (lines 39-42) to read the new path, run `JSON.parse` on the text and check the `language` setting.
  - Leave `adapters.test.ts` lines 110-115 alone. They test the store port with `settings.json` only as a sample file name.
- **GOTCHA**: Never write the name `.obsidian` into code that runs outside tests. The `obsidianmd/hardcoded-config-path` lint rule rejects it, because the folder can be renamed, and CLAUDE.md forbids switching that rule off. Test files may use it.
- **GOTCHA**: Never write to the fixture `test-vault/`. The scenario and CLI tests already copy it, and `.gitignore` line 44 already ignores `test-vault/.obsidian/plugins/*/data.json`.
- **VALIDATE**: `pnpm vitest run --project test-client && pnpm typecheck`

### Task 6: UPDATE e2e-tests/smoke.e2e.ts

- **IMPLEMENT**:
  - In the test "saves a setting and reads it back" (lines 128-145), read ``normalizePath(`${app.vault.configDir}/plugins/task-orchestrator/data.json`)`` through `app.vault.adapter.read`, run `JSON.parse` on it and expect `language` to be `en-US`.
  - Add one test for a damaged settings file:
    1. Write `{ not json` to that path.
    2. Disable and enable the plugin.
    3. Run the `settings` query.
    4. Run `updateSettings` with `language` set to `en-US`.
    5. Read the file again.
  - Expect one of two results from step 3, depending on how `loadData` treats the text. If `loadData` throws, the query fails with `SETTINGS_FILE_UNREADABLE`. If it returns something other than `null` that is not an object, the query succeeds with the load status `corrupt`. Either way, step 4 fails with `SETTINGS_FILE_UNREADABLE`, and step 5 finds the file still holding `{ not json`.
- **GOTCHA**: If `loadData` returns `null` for that text, step 4 overwrites the damaged file. Stop and report that to the owner rather than working around it. Fixing it means a design choice the TAD does not cover, for example reading the file through `app.vault.adapter` before saving.
- **VALIDATE**: `pnpm e2e`

### Task 7: UPDATE the settings slice README, README.md and CLAUDE.md to say where settings are kept

- **IMPLEMENT**: Make these three edits with the `/drafting:seamless-edit` skill, which applies agreed edits so they read as part of the original text.
  - `packages/core/src/settings/README.md`:
    - Rewrite the Flows and Rules sections to describe the settings port.
    - Replace the store failure outcome with the read-failure and write-failure outcomes from Task 3.
    - Rename the heading "Store file owned" to "File owned", and make its text name Obsidian's settings file for the plugin.
  - The top-level `README.md`, Configuration section: replace the sentence beginning "Settings are stored in `.task-orchestrator/settings.json`" with one saying settings are kept in Obsidian's own settings file for the plugin, with the licence key as the exception. Keep the paragraph on plugin-owned data in `.task-orchestrator/`.
  - `CLAUDE.md` Section 2, **Database** line: keep the sentence on the local store. Replace the settings sentence with one saying user settings live in Obsidian's settings file for the plugin (`data.json`), read and written only through the settings port by the `settings` query and the `updateSettings` operation.
- **GOTCHA**: Leave the README's "Automatic changes" row in the configuration table as it is. The feature that builds that setting decides where it is kept, and adds the per-computer functions.
- **VALIDATE**: `pnpm format:check`, then `git grep -n "settings\.json" -- packages e2e-tests README.md CLAUDE.md`, which should list only the store adapter tests' sample file name.

---

## TESTING STRATEGY

### Unit Tests

Core: the slice tests in Task 3, using `createInMemorySettings`. Plugin: the adapter test in Task 4 and the updated `settings-state.test.ts`. Test client: the adapter tests in Task 5. The core coverage threshold (80% of lines, `vitest.config.ts` line 15) must still pass.

### Integration Tests

The test-client CLI and scenario tests (Task 5), and the real-Obsidian smoke test (Task 6).

### Edge Cases

Nothing saved yet; a saved value that is not an object, or is an array; a field of the wrong type; an unrecognised key kept on save; a load or save that throws; a damaged `data.json` in a real Obsidian.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

`pnpm lint && pnpm format:check && pnpm typecheck`

### Level 2: Unit Tests

`pnpm test`

### Level 3: Integration Tests

`pnpm e2e`

### Level 4: Manual Validation

Run the test-client check in `.claude/commands/validate/validate.md` section 4, which runs `updateSettings` against a copy of `test-vault/`. Then confirm that `<copy>/.obsidian/plugins/task-orchestrator/data.json` holds `"language": "en-US"` and that `<copy>/.task-orchestrator/settings.json` does not exist.

---

## ACCEPTANCE CRITERIA

- [ ] No code reads or writes `.task-orchestrator/settings.json`, apart from the store adapter tests' use of that name as a sample file
- [ ] The `settings` query and `updateSettings` keep their versions, input fields and success results
- [ ] The core tests show a damaged settings file is never overwritten, and so does a real Obsidian, unless Task 6 shows `loadData` returning `null` for it, in which case the owner decides
- [ ] `ports.ts` is at most 300 lines
- [ ] The settings slice README, README.md and CLAUDE.md Section 2 name Obsidian's settings file
- [ ] Lint, format, type check, unit tests and real-Obsidian tests pass

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately, apart from the type check expected to fail between Tasks 2 and 5
- [ ] All validation commands executed successfully
- [ ] No linting or type checking errors
- [ ] Acceptance criteria all met

---

## NOTES

- **No move of existing settings.** The repository has no tags and no GitHub releases, so I infer that no user holds a `settings.json` to carry over. I have not checked whether anyone has built the plugin from source.
- **A port narrower than the TAD's.** The TAD's port also has the two per-computer functions. Leaving them out until a feature needs them follows YAGNI in CLAUDE.md Section 1. The TAD needs no edit, because it describes the finished design.
- **Where the test client keeps the file.** The TAD's port table says the test client keeps "two files beside the fixture vault". This plan uses the path Obsidian itself uses inside the vault, so the plugin and the test client share one file, and the existing `.gitignore` entry already covers it. Sharing keeps the test client's purpose: the same request on the same vault gives the same result with or without Obsidian, which holds only if both read the same settings. The second file belongs to the per-computer functions and is not created yet.
- **Out of scope.** Two parts of README.md mention the automatic-changes setting (whether this computer makes the changes the application works out itself), which is not built yet: the description of `firstRun`, the operation that sets up a new vault, and the FAQ on using two computers.

Confidence for one-pass success: 8/10. The open point is how `loadData` treats a damaged `data.json` (Task 6).
