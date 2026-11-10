# Feature: Obsidian plugin foundation (AI-optimised codebase setup)

**Requirements:** `.agents/PRD.md` 1.0 and `.agents/TAD.md` 0.2. **Plan written:** 2026-11-10. **Execute with:** `/implement:execute .agents/plans/obsidian-plugin-foundation.md`, after the project owner approves this plan.

## Feature Description

The repository today holds only planning documents and agent tooling. This plan builds the technical foundation of the Personal Task Orchestrator Obsidian plugin in twelve sequential steps (plus the pre-flight, Step 0): validation tooling, structured JSON logging, an application core reached through ports, the plugin package with an adapter for every port, a headless test client, tests inside a real Obsidian, release automation that satisfies the community directory's automated review, and the `README.md` and `CLAUDE.md` that govern later feature work. It delivers no user feature. Its only user-visible behaviour is a `ping` command and a one-item settings tab, which prove the wiring end to end.

## DECISION REGISTER (resolved)

### Parameters

| Placeholder | Resolved value | Rule check and justification |
|---|---|---|
| `{{PLUGIN_ID}}` | `task-orchestrator` | TAD 10.1 T4: "Answered: the plugin identifier is `task-orchestrator` (PRD Q2)." Lowercase and hyphens only; no `obsidian`; does not end with `plugin`. Unique: absent from the directory mirror `obsidianmd/obsidian-releases/community-plugins.json` (10,200 entries) on 2026-11-10. Cannot change after publication. |
| `{{PLUGIN_NAME}}` | `Personal Task Orchestrator` | Neither document fixes the manifest name; this is the application name in the PRD and TAD titles. Basic Latin, no "Obsidian", no "Plugin", not a core feature name, no directory entry contains "orchestrator". **Assumption** (see NOTES Q1). |
| `{{PLUGIN_DESCRIPTION}}` | `Capture everything in your life in one place, organise it, set priorities and make commitments, then focus on getting stuff done in short bursts and run regular reviews. On paid plans, AI takes care of the organising and reviewing, with a free trial.` | Set by the project owner on 2026-11-10. Starts with an action statement; ends with a period; exactly 250 characters, the maximum allowed, so any later edit must not lengthen it; no emoji; does not mention "Obsidian" or "plugin". It describes the finished product, including the paid plan, not this foundation. |
| `{{MIN_OBSIDIAN_VERSION}}` | `1.15.0` | TAD 8.2: "The first submission sets the minimum Obsidian version in the manifest to the release current at that time." 1.15.0 is the current public desktop release (published 2026-11-02, `obsidian-releases` GitHub releases). TAD 1.2 A and risk 9 record behaviour proven on 1.15.0. Re-checked at first submission (TAD 8.2). |
| `{{AUTHOR}}` | `Rahul Parmar` | Neither document names the manifest author. Rahul Parmar owns this repository. **Assumption** (NOTES Q1). No `authorUrl`, no `fundingUrl`. |
| `{{LICENCE}}` | Elastic License 2.0, SPDX `Elastic-2.0`, licensor "Rahul Parmar" | TAD E18: "A public one under the Elastic License 2.0 … holds the application core, the plugin and the test client." PRD 9: "The plugin repository is public and published under the Elastic License 2.0." |
| `{{NODE_VERSION}}` | `26` | The rule is the current long-term-support release. On 2026-11-10 Node 26 is Active LTS (since 2026-10-28), 24 and 22 are Maintenance LTS (nodejs.org/en/about/previous-releases). The TAD 2.7 says "Node 22 … The current long term support release", which was true when written; its reason now points to 26. Conflict listed in NOTES C4. The owner's machine runs Node 26.8.1. |

### Decisions

| ID | Resolution | Justifying passage |
|---|---|---|
| **D1** Platform | **Override: `isDesktopOnly: true`.** Node imports allowed in `packages/plugin` and `packages/test-client`, never in `packages/core`. Mobile emulation is dropped from the e2e capabilities and acceptance gates. | PRD 9: "Directory compliance on every release. … `isDesktopOnly` is true." TAD 5 risk 1: "The plugin is declared desktop-only, which its use of desktop-only functions requires." TAD 7.3: "Phones and tablets are not tested because the plugin is desktop-only." |
| **D2** Headless client | **Override: `packages/test-client/`** (package `@task-orchestrator/test-client`), a file-based adapter for every port and `createTestClient(vaultPath)`, built in Step 8, with a scenario test against a copy of `test-vault/` and a minimal command-line entry. | PRD G7 / F15.4: "A test client drives the application core without Obsidian and is delivered with this phase." TAD 2.1: "The test client, a TypeScript program run from a command line. It supplies adapters for the same ports using plain files and drives the core without Obsidian." |
| **D3** Plugin-owned data | **Override: a `StorePort` in the core and a store adapter in the plugin writing to `.task-orchestrator/` at the vault root.** Application log lines also go to the store through the log-sink adapter. | TAD E3: "The local store is one hidden folder at the top of the vault, `.task-orchestrator/`". TAD E14: "The local store also holds … the application log." TAD 3.3 lists `logs/application.jsonl`. |
| **D4** Error-code domains | **Default:** the feature-slice names from TAD 2.3 plus `CORE`: `CORE`, `CAPTURE`, `CLARIFY`, `ORGANISE`, `STRUCTURE`, `DASHBOARD`, `REVIEW`, `LINT`, `VAULT`, `EXPORT_IMPORT`, `SETTINGS`, `LICENSING`, `PAID_SERVICE`. A slice folder name with a hyphen becomes one underscore-joined domain token (`export-import` → `EXPORT_IMPORT`). `CORE` is the infrastructure domain. Log-event domains are the lower-case folder names (`core`, `capture`, `export-import`), plus `plugin` and `test-client` for events written by those packages. Recorded in `CLAUDE.md` at Step 12. | TAD 3.1: "Each code starts with its feature's name, or `CORE` for the shared ones, and says whether trying again might work. Each feature adds its own, such as `ORGANISE_BLOCKER_LOOP` or `REVIEW_ALREADY_OPEN`." |

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `.agents/templates/template_claude_md.md`, `.agents/templates/template_readme.md` (whole files) - Why: Step 12 structure. Both are written for a Python web service; see NOTES C7 and the Step 12 mapping table.
- `.claude/commands/validate/validate.md` - Why: already written for this workspace's scripts; Step 12 fills in its real values.
- `.claude/commands/git/commit.md` - Why: `/git:commit` is used at every commit boundary; it stages files explicitly by path and adds `Breadcrumbs:` and `Session:` footers.
- `.gitignore` - Why: already holds every entry this plan needs; Task 1.1 confirms it.

### Relevant Documentation

- [Obsidian sample plugin, `master` branch](https://github.com/obsidianmd/obsidian-sample-plugin) — Why: Step 1 source template. Default branch is `master`. Uses `builtinModules` from `node:module`, `eslint.config.mts` loaded through `jiti`, `version-bump.mjs`, `.npmrc` `tag-version-prefix=""`, `lint.yml` and `release.yml`.
- [eslint-plugin-obsidianmd README](https://github.com/obsidianmd/eslint-plugin#readme) and [docs/configuration.md](https://github.com/obsidianmd/eslint-plugin/blob/main/docs/configuration.md) ("Upgrading to 0.5.0", "Community plugin scanner configuration") — Why: Step 2. Latest 0.5.1 (2026-11-06). `configs.recommended` already includes ESLint recommended, typescript-eslint `recommendedTypeChecked`, Obsidian rules, `no-console` (inside `obsidianmd/rule-custom-message`), and lints `package.json`, `manifest.json` and `LICENSE`. Requires your own `obsidian` dev dependency or `no-unsupported-api` silently reports nothing. Keep TypeScript on 5 or 6.
- [typescript-eslint typed linting](https://typescript-eslint.io/getting-started/typed-linting), [shared configs](https://typescript-eslint.io/users/configs#strict-type-checked), [parser `projectService`](https://typescript-eslint.io/packages/parser#projectservice), [no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises), [no-deprecated](https://typescript-eslint.io/rules/no-deprecated), [switch-exhaustiveness-check](https://typescript-eslint.io/rules/switch-exhaustiveness-check) — Why: Steps 2 and 4. `tseslint.config()` is deprecated; use ESLint's `defineConfig` from `eslint/config`. Peer range `typescript >=4.8.4 <6.1.0`.
- [ESLint configuration files](https://eslint.org/docs/latest/use/configure/configuration-files) and [migrate to v10](https://eslint.org/docs/latest/use/migrate-to-10.0.0); [no-restricted-imports](https://eslint.org/docs/latest/rules/no-restricted-imports) — Why: Steps 2 and 4. ESLint 10 needs `jiti` ≥ 2.2.0 for `.mts` configs and looks up the config from each linted file's directory upward.
- [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier#installation) — Why: Step 2. Import `eslint-config-prettier/flat`, place last.
- [Prettier configuration](https://prettier.io/docs/configuration), [ignore](https://prettier.io/docs/ignore) — Why: Step 2.
- [TypeScript tsconfig reference](https://www.typescriptlang.org/tsconfig/) (strict family, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `allowImportingTsExtensions`) — Why: Step 3.
- [Node.js: running TypeScript natively](https://nodejs.org/api/typescript.html) — Why: Steps 1, 6, 8. Type stripping is stable without a flag on Node 26. Relative imports must carry the `.ts` extension; type-only imports need `import type`; no enums, namespaces with runtime code, parameter properties or decorators; does not run files inside `node_modules`.
- [pnpm workspaces](https://pnpm.io/workspaces), [pnpm-workspace.yaml](https://pnpm.io/pnpm-workspace_yaml), [build settings `allowBuilds`](https://pnpm.io/settings/build), [filtering](https://pnpm.io/filtering) — Why: Step 1. pnpm 12.18.0: settings other than auth/registry live in `pnpm-workspace.yaml`; dependency build scripts are blocked by default and `strictDepBuilds` fails the install for an unlisted one; `minimumReleaseAge` defaults to one day.
- [Vitest projects](https://vitest.dev/guide/projects), [coverage](https://vitest.dev/guide/coverage), [migration guide](https://vitest.dev/guide/migration), [fake timers `vi.useFakeTimers`](https://vitest.dev/api/vi#vi-usefaketimers) — Why: Step 5. Vitest 5.1: `vite` is a peer dependency; workspace files are gone, use `test.projects`; coverage is configured only in the root config; projects inherit root options by default.
- [Zod basics](https://zod.dev/basics) and [API](https://zod.dev/api) — Why: Step 8. Zod 4: `import * as z from 'zod'`; `z.infer`, `safeParse`, `z.discriminatedUnion`, `z.looseObject`.
- [JSON Lines](https://jsonlines.org/) — Why: Step 6 line format.
- Obsidian developer docs: [Manifest](https://docs.obsidian.md/Reference/Manifest), [Versions](https://docs.obsidian.md/Reference/Versions), [Submission requirements](https://docs.obsidian.md/Community+directory/Submission+requirements+for+plugins), [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines), [Settings](https://docs.obsidian.md/Plugins/User+interface/Settings), [Migrate to declarative settings](https://docs.obsidian.md/Plugins/Guides/Migrate+to+declarative+settings), [Store secrets](https://docs.obsidian.md/Plugins/Guides/Store+secrets), [Vault](https://docs.obsidian.md/Plugins/Vault), [Optimize plugin load time](https://docs.obsidian.md/Plugins/Guides/Optimize+plugin+load+time), [Release your plugin with GitHub Actions](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions) — Why: Steps 1, 9, 11. The pinned `node_modules/obsidian/obsidian.d.ts` is the authority for exact signatures (`getSettingDefinitions`, `SecretStorage`, `processFrontMatter`, `getFrontMatterInfo`).
- [esbuild API](https://esbuild.github.io/api/) (`external`, `format`, `target`, `metafile`, `context`, plugins `onEnd`) — Why: Step 9.
- [wdio-obsidian-service README](https://github.com/jesse-r-s-hines/wdio-obsidian-service/blob/main/packages/wdio-obsidian-service/README.md), [browser commands API](https://jesse-r-s-hines.github.io/wdio-obsidian-service/wdio-obsidian-service/ObsidianBrowserCommands.html), [sample plugin](https://github.com/jesse-r-s-hines/wdio-obsidian-service-sample-plugin) (`wdio.conf.mts`, `.github/workflows/test.yaml`, `check_for_new_obsidian.yaml`) — Why: Step 10. Version 3.5.0 (2026-11-01) supports WebdriverIO 10; `browserVersion`/`appVersion` `earliest` means the manifest's `minAppVersion`; helpers `browser.executeObsidian`, `browser.executeObsidianCommand`, `obsidianPage.resetVault`; Linux CI uses Xvfb plus a window manager.
- [obsidianmd/obsidian-workflows](https://github.com/obsidianmd/obsidian-workflows) — Why: Step 11 scanner-lint in CI (`uses: obsidianmd/obsidian-workflows@v1`, input `scanner-lint: true`; detects pnpm from `pnpm-lock.yaml`).
- [actions/attest](https://github.com/actions/attest) (v4) and [GitHub artifact attestations](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations) — Why: Step 11. Attestations are available for public repositories on every GitHub plan.
- [Dependabot configuration](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference) — Why: Step 11.

### Patterns to Follow

**Naming:** verbose names (`noteId`, `operationName`, `correlationId`, `createdAt`), never `id`, `op`, `ts`. Front-matter field names stay exactly as the PRD fixes them (for example the note's `id` field). `camelCase` values, `PascalCase` types/classes/Zod schemas (`RequestEnvelopeSchema`), `UPPER_SNAKE_CASE` constants. Files ≤ 300 lines, functions ≤ 50 lines.

**Imports:** relative imports carry the `.ts` extension (`import { newId } from './ids.ts';`) so Node runs the code without a build; type-only imports use `import type`. No enums, no parameter properties, no namespaces (`erasableSyntaxOnly`). Use string-literal unions and `as const` objects instead of enums.

**TSDoc on every export:**

```ts
/**
 * Creates a logger that writes one JSON object per event to the given sink.
 *
 * @param logSink - Where finished log lines are delivered.
 * @param clock - Source of the current time for each line's timestamp.
 * @param loggerOptions - Minimum level to write; lower levels are dropped.
 * @returns A logger whose events carry no correlation ID until `withCorrelation` is used.
 */
export function createLogger(logSink: LogSink, clock: ClockPort, loggerOptions: LoggerOptions = {}): Logger {
```

**Logging:**

```ts
const operationLog = logger.withCorrelation(correlationId);
operationLog.info('core.api.operation_started', { operationName, operationVersion, actor });
// … work …
operationLog.info('core.api.operation_completed', { operationName, operationVersion, durationMs });
// failure
operationLog.error('core.api.operation_failed', { operationName, errorCode: 'CORE_INTERNAL_ERROR', thrownError: describeThrown(thrown) });
```

**Error handling:** inside the core, failures are values:

```ts
return { ok: false, correlationId, error: createAppError('CORE_INPUT_INVALID', 'Request payload failed schema validation.', false, { issuePaths }) };
```

**Ports and adapters:** the core declares interfaces in `packages/core/src/core/ports.ts`; each host supplies one adapter object per port. Adapters return discriminated outcome objects for expected conditions (`{ status: 'conflict', conflictingFields }`) and may throw only for unexpected faults, which `execute` turns into `CORE_INTERNAL_ERROR`.

**Obsidian host code:** `this.app`, never global `app`; `register*` helpers for every listener; `instanceof TFile`, never casts; `normalizePath` on every path; `window.setTimeout`/`activeWindow`; no `innerHTML`, no inline styles; `console.debug`/`warn`/`error` only; every event handler wrapped in `try`/`catch`.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each step ends with a COMMIT task; never start the next step while any check of the current step fails. Steps run sequentially, never in parallel. A fresh context window per step is acceptable: re-read this plan and the files the step names.

Rules that apply to every task:

- Dependencies only with `pnpm add` / `pnpm add -D` (`-w` for the root, `--filter <package-name>` for a package). Never edit dependency lists or `pnpm-lock.yaml` by hand.
- `// eslint-disable` and `// @ts-expect-error` only with a documented reason on the same line. Never disable a security rule or an `obsidianmd/*` rule, by comment or by config.
- Stage files explicitly by path; never `git add .`, `git add -A`, `git add --all`. Commit with `/git:commit`, passing the step's commit message as notes.
- Pushing a branch or tag to GitHub is outward-facing: ask the project owner in chat and wait for a clear yes before the first push of each step that needs one (Steps 10 and 11).
- Package names: `@task-orchestrator/core`, `@task-orchestrator/plugin`, `@task-orchestrator/test-client`. Filter commands use these full names, for example `--filter @task-orchestrator/core`; a short filter such as `--filter core` does not match scoped names.

---

### STEP 0 — PRE-FLIGHT

#### Task 0.1 VERIFY the Day-0 kit and record the pre-flight result

- **IMPLEMENT**: Confirm each Day-0 kit path exists: `.agents/reference/obsidian-community-plugin-development.md`, both `.agents/templates/` files, `.claude/commands/git/commit.md`, `.claude/commands/validate/validate.md`, `.gitignore`. Confirm the Decision Register above is still accurate: re-run the uniqueness check for `task-orchestrator`, and check whether Obsidian has published a newer public release than 1.15.0 (if so, stop and ask the owner whether `minAppVersion` follows it).
- **GOTCHA**: A missing Day-0 file stops the plan. A present file with incomplete content does not; it is fixed in Task 1.1 and folded into Step 1's commit.
- **VALIDATE**:
  ```bash
  for f in .agents/reference/obsidian-community-plugin-development.md .agents/templates/template_readme.md .agents/templates/template_claude_md.md .claude/commands/git/commit.md .claude/commands/validate/validate.md .gitignore; do test -f "$f" && echo "ok $f" || echo "MISSING $f"; done
  curl -s https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json | python3 -I -c "import json,sys; d=json.load(sys.stdin); print('id taken' if any(p['id']=='task-orchestrator' for p in d) else 'id free')"
  gh api repos/obsidianmd/obsidian-releases/releases --jq '[.[] | select(.prerelease==false)][0].tag_name'
  ```
  Expected: six `ok` lines, `id free`, `v1.15.0`.

#### Task 0.2 VERIFY local prerequisites

- **IMPLEMENT**: Node 26 is installed (`node -v` → `v26.x`). pnpm is not installed and Node 26 no longer ships Corepack. Ask the owner to approve installing pnpm globally with `npm install -g pnpm@12`; do not install it without that approval. Confirm `gh auth status` succeeds and `git remote -v` shows `origin` (`rahulpdev/task-orchestrator`, public).
- **VALIDATE**: `node -v && pnpm -v && gh auth status`

No commit for Step 0: it writes no code.

---

### STEP 1 — INITIALISE THE WORKSPACE

**Documentation research:** Obsidian's Build a plugin guide and its Manifest and Versions reference pages; the sample plugin repository at `master` (record the commit hash used); pnpm workspaces and `pnpm-workspace.yaml` docs; Node's TypeScript page.

#### Task 1.1 UPDATE `.gitignore`

- **IMPLEMENT**: Nothing to add: `.gitignore` already holds every entry this plan's layout needs (Node and pnpm, build output, coverage and test caches, the development vault, `.wdio-obsidian-cache/`, agent reports, and the git-ignored PRD and TAD). Confirm it with the check below.
- **GOTCHA**: Trailing `# …` comments on the same line as a pattern are not comments in `.gitignore`; put comments on their own lines. The existing `logs/` pattern also ignores `test-vault/.task-orchestrator/logs/`, which is intended.
- **VALIDATE**: `git check-ignore -v main.js coverage/x node_modules/x .wdio-obsidian-cache/x test-vault/.obsidian/plugins/task-orchestrator/main.js` prints a rule for each.

#### Task 1.2 CREATE the workspace from the official template

- **IMPLEMENT**:
  1. Clone the template into the scratchpad, not the repository: `git clone --depth 1 --branch master https://github.com/obsidianmd/obsidian-sample-plugin "$SCRATCH/sample-plugin"`; record `git -C "$SCRATCH/sample-plugin" rev-parse HEAD` in the commit body.
  2. Copy into the repository: `manifest.json`, `versions.json`, `styles.css`, `.editorconfig`, `.npmrc` → root; `esbuild.config.mjs` → `packages/plugin/esbuild.config.mjs`; `version-bump.mjs` → `scripts/version-bump.mjs`; `eslint.config.mts` → root (replaced in Step 2); `.github/workflows/lint.yml`, `.github/workflows/release.yml` → `.github/workflows/`; `src/main.ts` → `packages/plugin/src/main.ts`. Do not copy `src/settings.ts` (sample code), `AGENTS.md` (read it, do not ship it), `README.md`, `LICENSE`, `package.json`, `package-lock.json` or `tsconfig.json` (replaced by Step 3's files).
  3. `packages/plugin/src/main.ts`: remove every sample class, command, ribbon icon, modal and settings tab. Leave a default-exported `TaskOrchestratorPlugin extends Plugin` with an empty `override async onload(): Promise<void> {}` and TSDoc.
  4. `packages/plugin/esbuild.config.mjs`: keep the template's options; change `outfile` to the repository-root `main.js` via `path.resolve(import.meta.dirname, '../../main.js')` and `entryPoints` to `path.resolve(import.meta.dirname, 'src/main.ts')`. (Fully reworked in Step 9.)
  5. `.github/workflows/lint.yml` and `release.yml`: replace `npm ci` with `pnpm install --frozen-lockfile` and `npm run` with `pnpm run`, add `pnpm/action-setup@v6` before `setup-node`, set `node-version-file: .nvmrc` and `cache: pnpm`, drop the Node matrix. These are interim; Step 11 replaces `lint.yml` with `ci.yml` and rewrites `release.yml`.
  6. `manifest.json` (tab-indented, keys in this order): `{"id": "task-orchestrator", "name": "Personal Task Orchestrator", "version": "0.1.0", "minAppVersion": "1.15.0", "description": "Capture everything in your life in one place, organise it, set priorities and make commitments, then focus on getting stuff done in short bursts and run regular reviews. On paid plans, AI takes care of the organising and reviewing, with a free trial.", "author": "Rahul Parmar", "isDesktopOnly": true}`. No `authorUrl`, no `fundingUrl`.
  7. `versions.json`: `{"0.1.0": "1.15.0"}`.
  8. `LICENSE`: the full Elastic License 2.0 text from https://www.elastic.co/licensing/elastic-license, licensor "Rahul Parmar", copyright year 2026, so GitHub recognises it as `Elastic-2.0`.
  9. `README.md`: one heading and one sentence ("Personal Task Orchestrator. Full README is written in Step 12 of `.agents/plans/obsidian-plugin-foundation.md`."). The directory requires a root README; Step 12 replaces it.
  10. Root `package.json` (write by hand once, then never edit dependency lists by hand): `name: "task-orchestrator"`, `version: "0.1.0"`, `private: true`, `type: "module"`, `license: "Elastic-2.0"`, `packageManager: "pnpm@12.18.0"` (or the exact version `pnpm -v` prints), `engines: { "node": ">=26" }`, and scripts that delegate to packages existing now:
      ```json
      "scripts": {
        "build": "pnpm --filter @task-orchestrator/plugin run build",
        "dev": "pnpm --filter @task-orchestrator/plugin run dev",
        "lint": "echo \"lint: configured in Step 2\"",
        "format:check": "echo \"format: configured in Step 2\"",
        "typecheck": "echo \"typecheck: configured in Step 3\"",
        "test": "echo \"test: configured in Step 5\"",
        "e2e": "echo \"e2e: configured in Step 10\"",
        "check:manifest": "echo \"check:manifest: configured in Step 11\"",
        "version": "node scripts/version-bump.mjs && git add manifest.json versions.json"
      }
      ```
  11. `pnpm-workspace.yaml`: `packages: ['packages/*']` and `allowBuilds: { esbuild: true }`.
  12. `packages/core/package.json`: `name: "@task-orchestrator/core"`, `version: "0.1.0"`, `private: true`, `type: "module"`, `license: "Elastic-2.0"`, `exports: { ".": "./src/index.ts" }`. `packages/core/src/index.ts`: `export {};` with a TSDoc file comment (filled in Step 8).
  13. `packages/plugin/package.json`: `name: "@task-orchestrator/plugin"`, `version: "0.1.0"`, `private: true`, `type: "module"`, `license: "Elastic-2.0"`, scripts `"build": "node esbuild.config.mjs production"`, `"dev": "node esbuild.config.mjs"`.
  14. `.nvmrc`: `26`.
  15. `packages/core/src/scratch.ts`: `export function greet(name: string): string { return \`Hello, ${name}\`; }` and, at module top level, `console.debug(greet('workspace'));` (nothing imports the scratch file, so printing unconditionally is safe). Run it with Node's native TypeScript support, which Node's documentation recommends (no extra runner). Anything in the file may be overwritten in later steps.
- **IMPORTS**: none yet.
- **GOTCHA**: The repository is already initialised on `main` with no commits and `origin` set; do not run `git init` again (NOTES C2). The template's esbuild version is pinned in Step 9 with `pnpm add`, not copied from the template's `package.json`. `pnpm install` must create `pnpm-lock.yaml`; with zero dependencies it may not, which is fine until Step 2.
- **VALIDATE**:
  ```bash
  node packages/core/src/scratch.ts            # prints: Hello, workspace
  pnpm install && pnpm -r ls --depth -1         # lists the root, core and plugin packages
  python3 -I -c "import json; m=json.load(open('manifest.json')); assert m['id']=='task-orchestrator' and m['isDesktopOnly'] is True and 'fundingUrl' not in m; print('manifest ok')"
  grep -rn "MyPlugin\|SampleSettingTab\|SampleModal\|Dynalist" packages/ LICENSE manifest.json || echo "no sample code"
  ```

#### Task 1.3 COMMIT Step 1

- **IMPLEMENT**: Stage explicitly: `.gitignore`, `.editorconfig`, `.npmrc`, `.nvmrc`, `manifest.json`, `versions.json`, `styles.css`, `LICENSE`, `README.md`, `package.json`, `pnpm-workspace.yaml` (and `pnpm-lock.yaml` if created), `eslint.config.mts`, `packages/core/package.json`, `packages/core/src/index.ts`, `packages/core/src/scratch.ts`, `packages/plugin/package.json`, `packages/plugin/esbuild.config.mjs`, `packages/plugin/src/main.ts`, `scripts/version-bump.mjs`, `.github/workflows/lint.yml`, `.github/workflows/release.yml`, `.agents/plans/obsidian-plugin-foundation.md`, `.agents/reference/obsidian-community-plugin-development.md`, `.agents/templates/template_readme.md`, `.agents/templates/template_claude_md.md`, `.claude/commands/git/commit.md`, `.claude/commands/validate/validate.md`, `.claude/commands/implement/execute.md`, `.claude/commands/plan/plan-feature.md`. `.agents/PRD.md` and `.agents/TAD.md` are git-ignored and never staged (NOTES C3).
- **COMMIT**: `chore: initial commit — plugin template as a pnpm workspace, planning documents and agent tooling`

---

### STEP 2 — LINT AND FORMAT

**Documentation research:** `eslint-plugin-obsidianmd` README and `docs/configuration.md` (0.5.1); ESLint flat-config and v10 migration pages; typescript-eslint typed linting; Prettier configuration; eslint-config-prettier.

#### Task 2.1 INSTALL lint and format tooling

- **IMPLEMENT**:
  ```bash
  pnpm add -D -w eslint typescript-eslint prettier eslint-config-prettier jiti typescript@5
  pnpm add -D -w --save-exact eslint-plugin-obsidianmd@0.5.1
  pnpm add -D --save-exact --filter @task-orchestrator/plugin obsidian@1.14.4
  ```
  `obsidian` is added now (not Step 9) because `eslint-plugin-obsidianmd` 0.5 needs it present or `no-unsupported-api` reports nothing; Step 9 confirms the pin. `@eslint/js` and `globals` are only needed if the config imports them.
- **GOTCHA**: ESLint 10 is current; `eslint-plugin-obsidianmd` 0.5.1 bundles plugins that do not yet declare ESLint 10 support, so pnpm prints peer-dependency warnings. Linting works; record the warning in the commit body. If pnpm refuses the install, fall back to `eslint@9` and record why. TypeScript must stay 5.x (`typescript@latest` is 7.0.2, which typescript-eslint and the Obsidian linter do not support). If `pnpm install` fails with an unlisted build script, read why the package needs it and add it to `allowBuilds` in `pnpm-workspace.yaml` as `true` or `false` deliberately.
- **VALIDATE**: `pnpm ls -w eslint typescript-eslint eslint-plugin-obsidianmd prettier typescript`

#### Task 2.2 CREATE `eslint.config.mts`

- **IMPLEMENT**: Replace the template file with one flat configuration:
  ```ts
  import { defineConfig, globalIgnores } from 'eslint/config';
  import obsidianmd from 'eslint-plugin-obsidianmd';
  import tseslint from 'typescript-eslint';
  import eslintConfigPrettier from 'eslint-config-prettier/flat';

  export default defineConfig(
  	globalIgnores(['**/node_modules/', 'main.js', 'dist/', 'coverage/', '.vitest/', '.wdio-obsidian-cache/', 'test-vault/', '.agents/', '.claude/', '.archon/', 'pnpm-lock.yaml']),
  	...obsidianmd.configs.recommended,
  	{
  		languageOptions: {
  			parserOptions: {
  				projectService: { allowDefaultProject: ['eslint.config.mts'] },
  				tsconfigRootDir: import.meta.dirname,
  			},
  		},
  	},
  	eslintConfigPrettier,
  );
  ```
  Apply `obsidianmd.configs.recommended` to every package, not only the plugin (NOTES C10: the directory scanner lints every non-ignored TypeScript file in the repository, including `packages/core` and `packages/test-client`). Do not add typescript-eslint's recommended configs separately: `obsidianmd.configs.recommended` already includes `recommendedTypeChecked`. Do not add a `no-console` rule: the Obsidian config already enforces `warn`, `error` and `debug` only.
- **GOTCHA**: ESLint 10 finds the config by walking up from each linted file; one root config serves all packages. Type-aware rules need every linted `.ts` file inside a tsconfig; until Step 3 creates them, `allowDefaultProject` covers only the config file, so lint may fail on `scratch.ts` and `main.ts` with "not found by the project service". Create a minimal temporary root `tsconfig.json` (`{"compilerOptions":{"strict":true,"noEmit":true,"lib":["ES2021","DOM"],"module":"nodenext","moduleResolution":"nodenext","allowImportingTsExtensions":true,"skipLibCheck":true},"include":["packages/*/src/**/*.ts","eslint.config.mts"]}`) now; Step 3 replaces it. `allowDefaultProject` rejects `**` globs and allows at most 8 files.
- **VALIDATE**: `pnpm exec eslint --print-config packages/plugin/src/main.ts | grep -c '"obsidianmd/'` is greater than 0; `pnpm exec eslint --print-config packages/core/src/scratch.ts | grep -A3 '"no-console"'` shows `warn`/`error`/`debug` allowed (or the `obsidianmd/rule-custom-message` equivalent).

#### Task 2.3 CREATE `.prettierrc` and `.prettierignore`

- **IMPLEMENT**: `.prettierrc`: `{ "useTabs": true, "tabWidth": 4, "singleQuote": true, "printWidth": 100 }` (matches the template `.editorconfig`: tabs, width 4, single quotes). `.prettierignore`: `node_modules/`, `pnpm-lock.yaml`, `main.js`, `dist/`, `coverage/`, `.vitest/`, `.wdio-obsidian-cache/`, `test-vault/.obsidian/`, `.agents/`, `.claude/`, `.archon/`, `LICENSE`. The planning documents and agent commands are owned by the project owner and must not be reformatted.
- **VALIDATE**: `pnpm exec prettier --check .` lists only files you have not yet formatted.

#### Task 2.4 UPDATE root scripts and prove the rules fire

- **IMPLEMENT**: Root scripts: `"lint": "eslint ."`, `"format": "prettier --write ."`, `"format:check": "prettier --check ."`. Rewrite `scratch.ts` to trip several rules on purpose (`console.log`, an unawaited promise from an `async` function, `as any`, `var`, `innerHTML` on a created element); run `pnpm lint` and confirm each is reported; then fix the file until `pnpm lint` and `pnpm format:check` are clean. Run `pnpm format` once to format the workspace files.
- **VALIDATE**: `pnpm lint && pnpm format:check`

#### Task 2.5 COMMIT Step 2

- **IMPLEMENT**: Stage `eslint.config.mts`, `.prettierrc`, `.prettierignore`, `tsconfig.json`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` (if changed), `packages/plugin/package.json`, `packages/core/src/scratch.ts` and any file `pnpm format` changed.
- **COMMIT**: `chore: add ESLint with the Obsidian rule set and Prettier`

---

### STEP 3 — STRICT TYPE CHECKING

**Documentation research:** TypeScript tsconfig reference for every flag below; Node's TypeScript page (`erasableSyntaxOnly`, `.ts` extensions).

#### Task 3.1 CREATE `tsconfig.base.json`

- **IMPLEMENT**:
  ```json
  {
  	"compilerOptions": {
  		"target": "ES2021",
  		"lib": ["ES2021", "DOM"],
  		"module": "nodenext",
  		"moduleResolution": "nodenext",
  		"strict": true,
  		"noImplicitReturns": true,
  		"noFallthroughCasesInSwitch": true,
  		"noUncheckedIndexedAccess": true,
  		"exactOptionalPropertyTypes": true,
  		"noImplicitOverride": true,
  		"noUnusedLocals": true,
  		"noUnusedParameters": true,
  		"isolatedModules": true,
  		"verbatimModuleSyntax": true,
  		"erasableSyntaxOnly": true,
  		"allowImportingTsExtensions": true,
  		"noEmit": true,
  		"skipLibCheck": true,
  		"forceConsistentCasingInFileNames": true
  	}
  }
  ```
- **GOTCHA**: `allowImportingTsExtensions` requires `noEmit`; nothing in this repository is emitted by `tsc` (esbuild bundles, Node strips types). `skipLibCheck` matches the template and protects against declaration files written for newer `lib` settings.

#### Task 3.2 CREATE per-package tsconfigs and the root tsconfig

- **IMPLEMENT**:
  - `packages/core/tsconfig.json`: extends `../../tsconfig.base.json`; `"compilerOptions": { "types": [] }` (excludes Node: the core sees only ES2021 and DOM globals); `"include": ["src/**/*.ts"]`.
  - `packages/plugin/tsconfig.json`: extends base; `"compilerOptions": { "module": "preserve", "moduleResolution": "bundler", "types": [] }`; `"include": ["src/**/*.ts"]`. The plugin is bundled by esbuild; it gains Node types only if a later slice needs a Node API (D1 allows it in this package).
  - Root `tsconfig.json` (replaces the Step 2 temporary one): extends base; `"compilerOptions": { "types": ["node"] }`; `"include": ["*.ts", "*.mts", "__mocks__/**/*.ts", "scripts/**/*.ts"]`. This gives the project service a home for root config files, the shim and script tests.
  - Install Node types for the root: `pnpm add -D -w @types/node@26` (if no 26.x exists yet, use the latest and record it).
  - Add `"typecheck": "tsc --noEmit -p tsconfig.json"` to each package's `package.json` scripts, and root `"typecheck": "pnpm -r run typecheck && tsc --noEmit -p tsconfig.json"`. `pnpm add -D -w typescript` is already done; packages resolve `tsc` from the root.
- **GOTCHA**: `pnpm -r run` skips the root package, so the root project is checked by the second command. With `exactOptionalPropertyTypes`, never assign `undefined` to an optional property; omit the key.

#### Task 3.3 UPDATE `scratch.ts` to exercise strict rules

- **IMPLEMENT**: Add code that triggers, then fix: an implicit `any` parameter; reading `array[0]` and using it without a check (`noUncheckedIndexedAccess`); assigning `undefined` to an optional property (`exactOptionalPropertyTypes`); a `switch` over a string-literal union missing a case (pair with a `never` exhaustiveness check); an unused local and an unused parameter. Iterate until clean. Keep `greet` working.
- **VALIDATE**: `pnpm typecheck && pnpm lint && pnpm format:check && node packages/core/src/scratch.ts`

#### Task 3.4 COMMIT Step 3

- **IMPLEMENT**: Stage `tsconfig.base.json`, `tsconfig.json`, `packages/*/tsconfig.json`, `packages/*/package.json`, `package.json`, `pnpm-lock.yaml`, `packages/core/src/scratch.ts`.
- **COMMIT**: `chore: add strict TypeScript configuration for every package`

---

### STEP 4 — TYPE-AWARE LINT RULES AND BOUNDARY RULES

**Documentation research:** typescript-eslint `strict-type-checked`, `no-floating-promises`, `no-deprecated`, `switch-exhaustiveness-check`; ESLint `no-restricted-imports`; the Obsidian linter README section on layering stricter configs.

#### Task 4.1 UPDATE `eslint.config.mts` with strict type-checked rules

- **IMPLEMENT**: After the Obsidian config, add:
  ```ts
  {
  	files: ['**/*.ts', '**/*.mts'],
  	extends: [tseslint.configs.strictTypeChecked],
  	rules: {
  		'@typescript-eslint/no-deprecated': 'error',
  		'@typescript-eslint/no-floating-promises': 'error',
  		'@typescript-eslint/switch-exhaustiveness-check': 'error',
  		// Replaced by eslint-plugin-obsidianmd's own rules (its README, "stricter configs"):
  		'@typescript-eslint/no-misused-promises': 'off',
  		'@typescript-eslint/no-require-imports': 'off',
  	},
  },
  ```
  JavaScript files (`*.mjs`) get `tseslint.configs.disableTypeChecked` in their own block so type-aware rules do not run on them.
- **GOTCHA**: Turning off the two typescript-eslint rules is what the Obsidian linter's README instructs, because it supplies replacements; it is not disabling an `obsidianmd/*` or security rule.

#### Task 4.2 ADD the core boundary import rules

- **IMPLEMENT**: A block with `files: ['packages/core/**/*.ts']`:
  ```ts
  import { builtinModules } from 'node:module';
  // …
  rules: {
  	'no-restricted-imports': ['error', {
  		paths: [
  			{ name: 'obsidian', message: 'The core never imports Obsidian (TAD E1). Declare a port instead.' },
  			{ name: 'electron', message: 'The core never imports Electron.' },
  			...builtinModules.map((moduleName) => ({ name: moduleName, message: 'The core never imports Node built-ins.' })),
  		],
  		patterns: [
  			{ group: ['@codemirror/*', '@lezer/*', 'node:*'], message: 'Not allowed in the core.' },
  		],
  	}],
  },
  ```
- **IMPLEMENT** (slice rule): create `scripts/check-core-boundary.mjs` now (Step 8 extends it; NOTES C12). It walks `packages/core/src/`, reads every `import`/`export … from`/dynamic `import()` specifier with a regular expression, resolves relative specifiers with `path.resolve`, and fails (exit code 1, one line per violation: file, specifier, rule) when:
  1. a file under `src/core/` resolves to anything under `src/` outside `src/core/` (core never imports `shared/` or a slice);
  2. a file under `src/<slice>/` resolves into `src/<otherSlice>/` to any file other than `src/<otherSlice>/index.ts` (slices use only what another slice publishes); `src/core/` and `src/shared/` are always allowed targets;
  3. a file under `src/shared/` resolves into a slice folder.
  It accepts `--root <dir>` (default `packages/core/src`) so tests can point it at a fixture tree. Root `lint` becomes `"eslint . && node scripts/check-core-boundary.mjs"`.
- **IMPLEMENT**: Expand `scratch.ts` to trip each new rule once (a floating promise, a call to a `@deprecated` function, a non-exhaustive `switch`, `import 'obsidian'`, `import 'node:fs'`), confirm `pnpm lint` reports each, then remove or fix them. Plant `packages/core/src/alpha/rules.ts` and `packages/core/src/beta/index.ts` importing `../alpha/rules.ts`; confirm the boundary script fails; delete both.
- **GOTCHA**: The scanner ignores `scripts/` and `.mjs` files, so this script is not scanned, but it is linted by our config (JavaScript block).
- **VALIDATE**:
  ```bash
  printf "import 'obsidian';\nexport {};\n" > packages/core/src/boundary-probe.ts
  pnpm lint; echo "exit=$? (expected non-zero)"
  rm packages/core/src/boundary-probe.ts
  pnpm typecheck && pnpm lint && pnpm format:check
  ```

#### Task 4.3 COMMIT Step 4

- **IMPLEMENT**: Stage `eslint.config.mts`, `scripts/check-core-boundary.mjs`, `package.json`, `packages/core/src/scratch.ts`.
- **COMMIT**: `chore: add type-aware lint rules and core boundary rules`

---

### STEP 5 — UNIT TESTS

**Documentation research:** Vitest projects, coverage, `resolve.alias`, `vi.useFakeTimers`, migration guide (Vitest 5); the pattern of aliasing `obsidian` to a hand-written shim with `resolve.alias`, since the `obsidian` package contains only type definitions.

#### Task 5.1 INSTALL Vitest

- **IMPLEMENT**: `pnpm add -D -w vitest @vitest/coverage-v8 vite`
- **GOTCHA**: Vitest 5 requires Node `^22.12 || ^24 || >=26` and `vite` ≥ 6.4 as a peer.

#### Task 5.2 CREATE `vitest.config.ts`

- **IMPLEMENT**:
  ```ts
  import path from 'node:path';
  import { defineConfig } from 'vitest/config';

  const repositoryRoot = import.meta.dirname;

  export default defineConfig({
  	test: {
  		coverage: {
  			enabled: true,
  			provider: 'v8',
  			reporter: ['text'],
  			include: ['packages/*/src/**/*.ts'],
  			exclude: ['**/*.test.ts'],
  		},
  		projects: [
  			{ test: { name: 'core', include: ['packages/core/src/**/*.test.ts'], environment: 'node' } },
  			{
  				resolve: { alias: { obsidian: path.resolve(repositoryRoot, '__mocks__/obsidian.ts') } },
  				test: { name: 'plugin', include: ['packages/plugin/src/**/*.test.ts'], environment: 'node' },
  			},
  		],
  	},
  });
  ```
  Step 8 adds `test-client` and `scripts` projects. The `obsidian` alias exists only in the `plugin` project; the core must not need it.
- **GOTCHA**: Coverage is root-only in Vitest 5; projects inherit root options unless `extends: false`. Vitest 5 writes reporter outputs under `.vitest/` (git-ignored in Task 1.1).

#### Task 5.3 CREATE `__mocks__/obsidian.ts`

- **IMPLEMENT**: Minimal shim with TSDoc on each export: empty classes `Plugin`, `Modal`, `PluginSettingTab`, `Setting`, `TFile`, `TFolder`, `MarkdownView`; `Notice` that records each message in an exported `shownNotices: string[]` array (tests reset it); `Platform = { isDesktop: true, isDesktopApp: true, isMobile: false, isMobileApp: false }`; `normalizePath(path)` that converts backslashes to `/`, collapses repeated slashes and trims leading/trailing slashes. Grow it only as plugin tests require (Step 9 adds `getFrontMatterInfo` and fields such as `TFile.path`).
- **GOTCHA**: The shim reflects assumptions about the API; the real-Obsidian tests (Step 10) prove integration.

#### Task 5.4 CREATE `packages/core/src/scratch.test.ts`

- **IMPLEMENT**: `describe` each function in `scratch.ts`, `it` states condition and result. Add an async function to `scratch.ts`, `greetAfterDelay(name, delayMs, schedule)`, where `schedule` is an injected `(callback: () => void, delayMs: number) => void` (the core has no timers of its own, TAD 2.4). The test calls `vi.useFakeTimers()`, passes a scheduler built on the faked timer, advances time with `vi.advanceTimersByTimeAsync`, and asserts the promise resolves only after the delay.
- **GOTCHA**: `obsidianmd/prefer-window-timers` may flag a bare `setTimeout` in test files. Never disable it. If it fires, build the scheduler from `vi`'s fake-timer API in a way the rule accepts; if that is impossible, stop and record the conflict for the owner.
- **VALIDATE**: Root script `"test": "vitest run"`; then `pnpm test && pnpm typecheck && pnpm lint && pnpm format:check`. Expected: all tests pass, a coverage table prints.

#### Task 5.5 COMMIT Step 5

- **IMPLEMENT**: Stage `vitest.config.ts`, `__mocks__/obsidian.ts`, `packages/core/src/scratch.ts`, `packages/core/src/scratch.test.ts`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json` (if its include changed).
- **COMMIT**: `chore: add Vitest with the Obsidian shim and coverage`

---

### STEP 6 — STRUCTURED LOGGING

**Documentation research:** jsonlines.org; Obsidian's plugin guidelines on console output (`warn`, `error` and `debug` only).

#### Task 6.1 CREATE `packages/core/src/core/ids.ts`

- **IMPLEMENT**: `newId(): string` returning `crypto.randomUUID()`, and `newCorrelationId(): string` delegating to `newId()`. TSDoc on `newCorrelationId` states it is the single place to change if correlation IDs become ULIDs (NOTES C8).
- **VALIDATE**: `ids.test.ts`: values match the UUID v4 pattern; two calls differ.

#### Task 6.2 CREATE `packages/core/src/core/ports.ts` (logging ports only)

- **IMPLEMENT**:
  ```ts
  export interface LogSink { write(logEvent: LogEvent): void }
  export interface ClockPort { now(): Date; timezone(): string }
  ```
  `LogEvent` is imported as a type from `logging.ts`. `timezone()` returns an IANA zone name (TAD 3.2).

#### Task 6.3 CREATE `packages/core/src/core/logging.ts`

- **IMPLEMENT**:
  - `type LogLevel = 'debug' | 'info' | 'warn' | 'error'` and `LOG_LEVEL_ORDER` constant.
  - `type LogFieldValue = string | number | boolean | readonly LogFieldValue[] | { readonly [fieldName: string]: LogFieldValue }` (no `null`).
  - `type LogFields = Readonly<Record<string, LogFieldValue | null | undefined>>`.
  - `interface LogEvent { readonly event: string; readonly level: LogLevel; readonly timestamp: string; readonly correlationId?: string; readonly [fieldName: string]: LogFieldValue | undefined }`.
  - `validateEventName(eventName: string): boolean`: exactly three dot-separated parts; regex `^[a-z][a-z0-9-]*\.[a-z][a-z0-9]*(?:_[a-z0-9]+)*\.[a-z][a-z0-9]*(?:_[a-z0-9]+)+$` (domain may contain hyphens for slices such as `export-import`; the third part is `action_state`, at least two snake-case words).
  - `interface Logger { debug(eventName, fields?): void; info(…); warn(…); error(…); withCorrelation(correlationId: string): Logger }`.
  - `createLogger(logSink, clock, loggerOptions?: { minimumLevel?: LogLevel })`: each call builds `{ ...cleanFields, event, level, timestamp: clock.now().toISOString(), correlationId? }` where `cleanFields` drops `undefined` and `null` values and the reserved keys `event`, `level`, `timestamp`, `correlationId` are always set last so fields cannot override them. `correlationId` is added only when set; never `null`, never `''`. Levels below `minimumLevel` (default `info`) are dropped. An invalid event name is not written as given: the logger writes `core.logging.event_rejected` at `error` level with `rejectedEventName` instead, and never throws. `sink.write` is wrapped in `try`/`catch` so a failing sink never breaks the caller.
  - `withCorrelation` returns a child logger sharing sink, clock and level, whose every event carries the ID; an empty string is treated as unset.
  - `describeThrown(thrown: unknown): LogFieldValue` returns `{ errorName, errorMessage, stack }` for `Error` values and `{ thrownValueType }` otherwise.
- **GOTCHA**: `core/core` must not import `shared/`, so timestamps use `Date.prototype.toISOString()` directly, not `shared/dates.ts`. Never log note content, licence keys or secrets.
- **VALIDATE**: `logging.test.ts` covers: event shape (`event`, `level`, `timestamp` ISO UTC ending `Z`, fields); correlation ID present when set and **absent as a key** (`'correlationId' in line === false`) when not, and absent for `''`; `null` and `undefined` fields dropped; reserved keys cannot be overridden; level filtering at each threshold; `validateEventName` accepts `core.jobs.tick_completed`, `core.vault.write_deferred`, `capture.note.creation_started`, `export-import.archive.copy_failed` and rejects `validation_started`, `core.started`, `Core.api.x_started`, `a.b.c.d_started`; invalid name produces one `core.logging.event_rejected` line; the sink receives exactly one object per event; a throwing sink does not throw out of `log.info`.

#### Task 6.4 CREATE `packages/core/src/demo.ts`

- **IMPLEMENT**: Builds a logger with a console sink (`console.debug(JSON.stringify(logEvent))`) and a real clock (`{ now: () => new Date(), timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone }`), then writes `core.demo.run_started`, `core.demo.run_completed` (with `durationMs`) under one correlation ID, and `core.demo.step_failed` with `errorCode: 'CORE_INTERNAL_ERROR'` and `describeThrown(new Error('demo'))`. Temporary; removed in Step 8.
- **VALIDATE**:
  ```bash
  node packages/core/src/demo.ts | tee /dev/stderr | python3 -I -c "import sys,json; lines=[json.loads(l) for l in sys.stdin if l.strip()]; assert len(lines)==3; assert all(v is not None for l in lines for v in l.values()); print('demo ok')"
  pnpm test && pnpm typecheck && pnpm lint && pnpm format:check
  ```

#### Task 6.5 COMMIT Step 6

- **IMPLEMENT**: Stage `packages/core/src/core/ids.ts`, `ids.test.ts`, `ports.ts`, `logging.ts`, `logging.test.ts`, `packages/core/src/demo.ts`.
- **COMMIT**: `feat(core): add structured logging with correlation IDs`

---

### STEP 7 — REMOVE THE VALIDATION SCAFFOLD

#### Task 7.1 REMOVE scratch files

- **IMPLEMENT**: `git rm packages/core/src/scratch.ts packages/core/src/scratch.test.ts`. Remove any reference to them in configs (none expected).
- **VALIDATE**: `pnpm test && pnpm typecheck && pnpm lint && pnpm format:check`. The passing test count equals the Step 6 logging and ids tests. Record the count in the commit body.

#### Task 7.2 COMMIT Step 7

- **COMMIT**: `chore: remove validation scaffold`

---

### STEP 8 — THE APPLICATION CORE

**Documentation research:** Zod 4 basics and API (`z.object`, `z.looseObject`, `z.infer`, `safeParse`, `z.discriminatedUnion`).

#### Task 8.1 INSTALL Zod

- **IMPLEMENT**: `pnpm add --filter @task-orchestrator/core zod` (Zod 4; `import * as z from 'zod'`).

#### Task 8.2 UPDATE `packages/core/src/core/ports.ts`

- **IMPLEMENT**: Complete the ports with the TAD 3.2 names (NOTES C13). Every function has TSDoc.
  ```ts
  export type FrontMatterValue = string | number | boolean | readonly FrontMatterValue[] | { readonly [key: string]: FrontMatterValue };
  export type FrontMatter = Readonly<Record<string, FrontMatterValue>>;
  export interface NoteSnapshot { readonly noteId: string; readonly notePath: string; readonly frontMatter: FrontMatter }
  export interface NoteDocument extends NoteSnapshot { readonly body: string }
  export type FrontMatterPatch = Readonly<Record<string, FrontMatterValue | null>>; // null removes the field
  export type FrontMatterExpectation = Readonly<Record<string, FrontMatterValue | null>>; // null means "absent"
  export type VaultWriteOutcome =
  	| { readonly status: 'written'; readonly appliedFields: readonly string[]; readonly conflictingFields: readonly string[] }
  	| { readonly status: 'deferred'; readonly reason: 'open_with_unsaved_changes' }
  	| { readonly status: 'not_found' };
  export type VaultChange =
  	| { readonly changeKind: 'changed'; readonly notePath: string }
  	| { readonly changeKind: 'renamed'; readonly notePath: string; readonly previousNotePath: string }
  	| { readonly changeKind: 'deleted'; readonly notePath: string };
  export interface VaultPort {
  	listManaged(): Promise<readonly NoteSnapshot[]>;                 // every Markdown note whose front matter has a string `id`
  	read(noteId: string): Promise<NoteDocument | null>;
  	patchFrontMatter(noteId: string, patch: FrontMatterPatch, expected: FrontMatterExpectation): Promise<VaultWriteOutcome>;
  	replaceContent(noteId: string, newBody: string, expectedBody: string): Promise<VaultWriteOutcome>;
  	create(request: { readonly title: string; readonly frontMatter: FrontMatter; readonly body: string }): Promise<NoteSnapshot>;
  	rename(noteId: string, newTitle: string): Promise<NoteSnapshot | null>;
  	trash(noteId: string): Promise<boolean>;
  	resolveLink(linkText: string, sourceNotePath: string): Promise<NoteSnapshot | null>;
  	onChange(listener: (vaultChange: VaultChange) => void): () => void; // returns unsubscribe
  }
  export type StoreReadOutcome = { readonly status: 'found'; readonly contents: string } | { readonly status: 'missing' };
  export interface StorePort {   // paths are relative to the store folder `.task-orchestrator/`
  	readFile(storePath: string): Promise<StoreReadOutcome>;
  	writeFileAtomic(storePath: string, contents: string): Promise<void>;
  	appendLine(storePath: string, line: string): Promise<void>;     // adds the trailing newline; creates folders
  	listFolder(storePath: string): Promise<readonly string[]>;
  	deleteFile(storePath: string): Promise<void>;
  }
  export interface NotifierPort { notice(message: string): void }
  export type SecretWriteOutcome = { readonly status: 'stored' } | { readonly status: 'unavailable' };
  export interface SecretsPort {
  	get(secretId: string): Promise<string | null>;
  	set(secretId: string, secretValue: string): Promise<SecretWriteOutcome>;
  	delete(secretId: string): Promise<void>;
  }
  export interface CoreAdapters {
  	readonly vault: VaultPort; readonly store: StorePort; readonly clock: ClockPort;
  	readonly notifier: NotifierPort; readonly secrets: SecretsPort; readonly logSink: LogSink;
  }
  ```
  Also export `frontMatterValuesEqual(currentValue: FrontMatterValue | undefined, expectedValue: FrontMatterValue | null): boolean` (JSON equality after mapping `undefined` to `null`) so both adapters apply one identical conflict rule (TAD E7).
- **GOTCHA**: Keep `ports.ts` under 300 lines; if it grows beyond, split into `core/ports/` (the TAD 2.3 layout). The paid-service port and `systemNotification` are deferred to their slices (NOTES C13).

#### Task 8.3 CREATE `packages/core/src/core/errors.ts`

- **IMPLEMENT**: `ERROR_DOMAINS` (`as const`, the D4 list); `type ErrorDomain`; `interface AppError { readonly errorCode: string; readonly message: string; readonly retryable: boolean; readonly details?: Readonly<Record<string, LogFieldValue>> }`; `CORE_ERROR_CODES = { targetNotFound: 'CORE_TARGET_NOT_FOUND', inputInvalid: 'CORE_INPUT_INVALID', confirmationRequired: 'CORE_CONFIRMATION_REQUIRED', storeUnavailable: 'CORE_STORE_UNAVAILABLE', internalError: 'CORE_INTERNAL_ERROR' } as const`; `isValidErrorCode(errorCode)` (starts with a listed domain plus `_`, then at least two upper-snake parts: `CORE_INPUT_INVALID` valid, `CORE_INVALID` invalid, `EXPORT_IMPORT_ARCHIVE_INVALID` valid); `createAppError(errorCode, message, retryable, details?)` that omits `details` when not given. `message` is a short developer-facing diagnostic in English; user-facing words come from the messages catalogue keyed by `errorCode`.
- **VALIDATE**: `errors.test.ts` covers each shared code, the validator's accept and reject cases, and `details` omitted rather than `undefined`.

#### Task 8.4 CREATE `packages/core/src/core/api.ts`

- **IMPLEMENT**:
  - `type Actor = 'user' | 'application'`; `RequestEnvelopeSchema = z.object({ name: z.string().min(1), version: z.number().int().positive(), actor: z.enum(['user', 'application']), correlationId: z.string().min(1).optional(), payload: z.unknown() })`; `type CoreRequest = z.infer<typeof RequestEnvelopeSchema>`.
  - `type Result<TOutcome> = { readonly ok: true; readonly correlationId: string; readonly outcome: TOutcome } | { readonly ok: false; readonly correlationId: string; readonly error: AppError }` (used for operations and queries, NOTES C14).
  - `type HandlerResult<TOutcome> = { readonly ok: true; readonly outcome: TOutcome } | { readonly ok: false; readonly error: AppError }`.
  - `interface OperationContext { readonly correlationId: string; readonly actor: Actor; readonly log: Logger; readonly adapters: CoreAdapters }`.
  - `defineOperation({ name, version, kind: 'operation' | 'query', request, outcome, handler })` returning a typed `OperationDefinition`; `request` and `outcome` are Zod schemas; `handler(payload, context): Promise<HandlerResult<TOutcome>>`.
  - `createOperationRegistry(definitions)` keyed by `` `${name}@${version}` ``; a duplicate key throws at construction (a programming error found at start-up, covered by a test), never during a request.
  - `createDispatcher(registry, adapters, logger, clock)` returning `{ execute, query }`. Each runs these steps and never lets an exception escape (one outer `try`/`catch` returning `CORE_INTERNAL_ERROR` as the last resort):
    1. `correlationId` = a valid envelope's `correlationId`, else a string `correlationId` found on the raw input, else `newCorrelationId()`.
    2. Envelope fails `RequestEnvelopeSchema.safeParse` → `CORE_INPUT_INVALID` with `details: { issuePaths }` (paths only, never values), logged as `core.api.request_rejected`.
    3. Unknown `name@version`, or a `kind` that does not match the entry point (`execute` runs only `operation`, `query` only `query`) → `CORE_INPUT_INVALID` with `details.reason` `unknown_operation` or `kind_mismatch`.
    4. Payload fails `definition.request.safeParse` → `CORE_INPUT_INVALID`, logged `core.api.request_rejected`; the handler never runs.
    5. Log `core.api.operation_started` `{ operationName, operationVersion, actor }`; run the handler with a correlated logger; a thrown error → `CORE_INTERNAL_ERROR`, logged `core.api.operation_failed` with `thrownError: describeThrown(thrown)` (including the stack).
    6. Handler `ok: false` → returned as is, logged `core.api.operation_failed` `{ errorCode, retryable }` at `warn`.
    7. Handler `ok: true` → `definition.outcome.safeParse`; failure → `CORE_INTERNAL_ERROR`, logged `core.api.outcome_rejected`; success → logged `core.api.operation_completed` `{ operationName, operationVersion, durationMs }`.
- **GOTCHA**: Keep `api.ts` ≤ 300 lines and each function ≤ 50: split the dispatcher steps into small private functions. Query logs use the same event names with `operationKind: 'query'`.

#### Task 8.5 CREATE the settings slice `packages/core/src/settings/`

- **IMPLEMENT**: User settings live in the local store from the start, at `.task-orchestrator/settings.json` (PRD F14.3: "Settings live in the local store, so they are exported with it (F10.1) and survive plugin reinstall"; TAD 3.3 and 8.4). They are read and written only through two operations named as in the TAD 3.1 catalogue, so every settings change goes through the internal API (PRD F15.2). This slice holds only the `language` setting today; the rest of PRD F14.1 is added when Feature 14 is built.
  - `schemas.ts`: `SETTINGS_STORE_PATH = 'settings.json'`; `UserSettingsSchema = z.looseObject({ language: z.enum(['en-GB', 'en-US']).default('en-GB'), appliedSettingsMigrations: z.array(z.string()).default([]) })` (`looseObject` keeps keys written by a newer version, so a save never deletes them); `type UserSettings`; `DEFAULT_USER_SETTINGS`; `SettingsChangeSchema = z.strictObject({ language: z.enum(['en-GB', 'en-US']).optional() })`.
  - `rules.ts`: `parseSettingsFile(fileContents: string): { settings: UserSettings; loadStatus: 'valid' | 'corrupt' }` (invalid JSON, a non-object or a wrong-typed field → defaults and `corrupt`; never throws); `type SettingsMigration = { readonly migrationName: string; migrate(settings: UserSettings): UserSettings }`; `applySettingsMigrations(settings, migrations)` running, in order, each migration not yet named in `appliedSettingsMigrations`, recording its name, and returning the unchanged settings plus `{ migrationFailed: migrationName }` if one throws (named, idempotent steps recorded in the saved data; running twice changes nothing). `SETTINGS_MIGRATIONS` is an empty array today.
  - `operations.ts`:
    - `settingsQuery`: `defineOperation({ name: 'settings', version: 1, kind: 'query', request: z.object({}), outcome: z.object({ settings: UserSettingsSchema, loadStatus: z.enum(['valid', 'defaulted', 'corrupt']) }) })`. Reads `settings.json` through `StorePort.readFile`: `missing` → defaults and `defaulted`; found → `parseSettingsFile`, then migrations in memory (they are saved by the next update); a corrupt file is logged `settings.file.load_rejected` at `warn`. A store read that throws → `CORE_STORE_UNAVAILABLE` (retryable).
    - `updateSettingsOperation`: `defineOperation({ name: 'updateSettings', version: 1, kind: 'operation', request: SettingsChangeSchema, outcome: z.object({ settings: UserSettingsSchema }) })`. Reads the current file the same way; if it is corrupt, refuses with `SETTINGS_FILE_UNREADABLE` (not retryable) and writes nothing, so a damaged file is never overwritten; otherwise merges the change, validates, writes with `StorePort.writeFileAtomic` as tab-indented JSON with a trailing newline, and logs `settings.file.update_completed` with `changedSettingNames` (PRD F14 validation: "Settings changes are recorded in the application log"). A store failure → `CORE_STORE_UNAVAILABLE`.
  - `index.ts`: publishes `settingsOperations` (both definitions) and the types `UserSettings`, `SettingsChange`.
  - `README.md`: the slice's flows (read, update), rules (defaults, corrupt file never overwritten, migrations), the store file it owns, and the features it touches (none yet).
- **GOTCHA**: The slice imports from `core/core` (allowed); nothing in `core/core` imports the slice. `createCore` in `src/index.ts` registers `settingsOperations` beside `ping`. The plugin's `data.json` is not used by this foundation: TAD 8.4 reserves it for the local store's layout version, which arrives with the vault slice (NOTES C9).
- **VALIDATE**: `rules.test.ts`: `parseSettingsFile` gives defaults and `corrupt` for `'not json'`, `'42'`, `'[]'`, `'{"language":"fr-FR"}'`; `'{}'` gives defaults and `valid`; unknown keys preserved; migrations applied once, recorded, skipped on a second run, failure reported without throwing. `operations.test.ts` (in-memory store adapter): missing file → `defaulted`; a saved `en-US` file → `en-US`; `updateSettings` writes the file and a following `settings` query returns the new value; a corrupt file makes `updateSettings` fail with `SETTINGS_FILE_UNREADABLE` and leaves the file byte-for-byte unchanged; a throwing store gives `CORE_STORE_UNAVAILABLE`; an unknown key in the change (`{ theme: 'dark' }`) is refused with `CORE_INPUT_INVALID` before the store is read.

#### Task 8.6 CREATE the messages catalogue `packages/core/src/core/messages/`

- **IMPLEMENT**: `index.ts` exports `type MessageCatalogue`, `type Language = 'en-GB' | 'en-US'` and `messagesFor(language): MessageCatalogue`. `en-GB.ts` and `en-US.ts` each export a `MessageCatalogue` object (typed with `satisfies MessageCatalogue` so the key sets cannot drift). Contents (sentence case; plain language):
  - `commands.pingName`: `Check that the application core responds`
  - `notices.pingSucceeded`: `Personal Task Orchestrator is working.`
  - `notices.settingsUnreadable`: `Your settings could not be read, so the defaults are in use for now. Your settings file has not been changed.`
  - `notices.operationFailed(errorCode)`: `Something went wrong (error code ${errorCode}). Try again. If it keeps happening, include this code in a support request.`
  - `settings.languageName`: `Language and spelling`; `settings.languageDescription`: `The English spelling the application uses in what it shows and writes.`; `settings.languageOptionBritish`: `UK English`; `settings.languageOptionAmerican`: `US English`
  - `errorNotices`: one entry per `CORE_ERROR_CODES` value and for `SETTINGS_FILE_UNREADABLE`, each saying what happened and what to do.
- **GOTCHA**: Every word the plugin shows lives here (TAD 2.3 "Wording and spelling"). The two files are identical today except where spelling differs; later slices add words such as "organise"/"organize".

#### Task 8.7 CREATE `packages/core/src/shared/dates.ts`

- **IMPLEMENT**: `toIsoUtc(date: Date): string` (`toISOString()`); `fromIso(isoText: string): Date | null` (null for unparseable input or a date-only/offset-less string that is ambiguous; accept full ISO 8601 with `Z` or offset). The folder exists for later cross-slice helpers (TAD 2.3: dates, links, inline fields).
- **VALIDATE**: `dates.test.ts`: round trip; offset input converted to UTC; garbage → `null`.

#### Task 8.8 CREATE `packages/core/src/core/diagnostics.ts` and `packages/core/src/index.ts`

- **IMPLEMENT**:
  - `diagnostics.ts`: `pingOperation = defineOperation({ name: 'ping', version: 1, kind: 'operation', request: z.object({}), outcome: z.object({ respondedAt: z.string() }), handler: async (_payload, context) => ({ ok: true, outcome: { respondedAt: context.adapters.clock.now().toISOString() } }) })`. It is the trivial operation the plugin's `ping` command runs (Step 9); it reads and writes nothing.
  - `index.ts`, the public surface. Runtime exports, exactly: `createCore`, `frontMatterValuesEqual` and `DEFAULT_USER_SETTINGS` (NOTES C14). Type exports: the port interfaces and their value types, `CoreAdapters`, `CoreRequest`, `Result`, `AppError`, `Actor`, `UserSettings`, `Language`, `MessageCatalogue`, `Logger`, `LogEvent`, `LogLevel`, `Core`.
  - `createCore(adapters: CoreAdapters, coreOptions?: { minimumLogLevel?: LogLevel }): Core` where `Core = { execute, query, logger, messagesFor }`. `logger` lets hosts write their own events (`plugin.*`, `test-client.*`) in the same line format; `messagesFor` lets hosts show words without holding wording.
- **VALIDATE**: `api.test.ts` with in-memory fakes for every port and a pretend clock (fixtures in, expected results out; no file system, no Obsidian):
  - `execute` rejects a malformed envelope (missing `actor`, `version: 0`) and a payload failing its schema; a spy handler is never called; the result is `CORE_INPUT_INVALID`.
  - A handler that throws yields `{ ok: false }` with `CORE_INTERNAL_ERROR`, the failure line carries `thrownError.stack`, and `await` does not reject.
  - An outcome failing its schema yields `CORE_INTERNAL_ERROR`.
  - The `correlationId` on the result equals the one on every log line of that request, both when supplied and when generated.
  - Unknown operation and kind mismatch yield `CORE_INPUT_INVALID` with the right `details.reason`.
  - A malformed envelope that still carries a `correlationId` returns that ID; a handler that throws a string (not an `Error`) yields `CORE_INTERNAL_ERROR` with `thrownError.thrownValueType`.
  - `ping` returns the pretend clock's time.
  - Duplicate registration throws at construction.
  - `index.test.ts`: the set of runtime export names equals `['DEFAULT_USER_SETTINGS', 'createCore', 'frontMatterValuesEqual']`.

#### Task 8.9 UPDATE `scripts/check-core-boundary.mjs` and ADD its test

- **IMPLEMENT**: Extend the Step 4 script: fail if `packages/core/package.json` lists `obsidian` in any dependency field; fail if any file under `packages/core/src/` contains the word `obsidian` (case-insensitive) in code or comments (TAD 2.1 "A second check bans any mention of Obsidian in the core's code"). Accept `--package-json <path>` for tests. `scripts/check-core-boundary.test.ts` builds fixture trees in a temp folder and runs the script with `node:child_process` `spawnSync`: a clean tree passes; a planted `import 'obsidian'` fails; a mention in a comment fails; a `package.json` dependency on `obsidian` fails; a cross-slice internal import fails; an import of another slice's `index.ts` passes; `core/` importing `shared/` fails.
- **IMPLEMENT**: Add projects to `vitest.config.ts`: `{ test: { name: 'scripts', include: ['scripts/**/*.test.ts'], environment: 'node' } }` and (Task 8.10) `{ test: { name: 'test-client', include: ['packages/test-client/src/**/*.test.ts'], environment: 'node' } }`.
- **GOTCHA**: The word check means the core's TSDoc must not name Obsidian; say "the host application" instead. The messages catalogue says "Personal Task Orchestrator", not "Obsidian".

#### Task 8.10 CREATE `packages/test-client/` [D2]

- **IMPLEMENT**:
  - `package.json`: `name: "@task-orchestrator/test-client"`, `private: true`, `type: "module"`, `license: "Elastic-2.0"`, `bin: { "task-orchestrator-test-client": "./src/cli.ts" }`, script `typecheck`. Install: `pnpm add --filter @task-orchestrator/test-client "@task-orchestrator/core@workspace:*" yaml` and `pnpm add -D --filter @task-orchestrator/test-client @types/node@26`.
  - `tsconfig.json`: extends base, `"types": ["node"]`, include `src/**/*.ts`.
  - `src/adapters/file-vault-adapter.ts`: `createFileVaultAdapter(vaultPath)`: walks Markdown files (skipping dot-folders), splits front matter with `yaml` (`parse`/`stringify`; only between a leading `---` line and the next `---` line), finds notes by front-matter `id`, applies the same per-field conflict rule with `frontMatterValuesEqual`, writes through a temp file and `rename`. `create` places the file at the vault root (the plugin follows Obsidian's "default location for new notes"; the difference is documented in the file's TSDoc), appends ` 2`, ` 3` to a taken title. `rename` renames the file only (no link updates; documented). `trash` moves the file to `<vault>/.trash/`. `resolveLink` matches the link text against file base names. `onChange` returns a no-op unsubscribe (the test client drives the core explicitly). `deferred` is never returned (no editor).
  - `src/adapters/file-store-adapter.ts`: store root `<vault>/.task-orchestrator/`; `writeFileAtomic` via `<path>.tmp` and `fs.rename`; `appendLine` with `fs.appendFile` and `mkdir -p`.
  - `src/adapters/file-secrets-adapter.ts`: a JSON file outside the vault whose path is a parameter; default `path.join(os.homedir(), '.config', 'task-orchestrator-test-client', 'secrets.json')`; tests always pass a temp path.
  - `src/adapters/printing-notifier-adapter.ts`: records notices in an array and writes each to `process.stderr`.
  - `src/adapters/clock-adapter.ts`: real clock, or a pretend clock `createPretendClock(startAt)` with `advanceBy(milliseconds)`.
  - `src/adapters/log-sink-adapter.ts`: JSON line to `process.stderr`, and an in-memory sink for tests.
  - `src/index.ts`: `createTestClient(vaultPath, testClientOptions?: { secretsFilePath?: string; clock?: ClockPort })` wiring every adapter into `createCore` and returning the `Core` plus the notifier's recorded notices.
  - `src/cli.ts`: `node packages/test-client/src/cli.ts <vaultPath> ping` prints the `Result` as JSON to stdout via `process.stdout.write` and exits 0 on `ok: true`, 1 otherwise; unknown command prints usage to stderr and exits 2.
- **IMPORTS**: `import { createCore, frontMatterValuesEqual } from '@task-orchestrator/core';` `import type { VaultPort, … } from '@task-orchestrator/core';` `import { parse, stringify } from 'yaml';` Node built-ins with the `node:` prefix.
- **GOTCHA**: Node refuses to strip types for files inside `node_modules`. pnpm links `@task-orchestrator/core` as a symlink that Node resolves to `packages/core/src/index.ts` (outside `node_modules`), so it works; if it does not, run the CLI with Node's `--preserve-symlinks` off (the default) and check `node -p "require.resolve('@task-orchestrator/core')"` from the test-client folder. Use `node:fs/promises`, never synchronous fs, in adapters.
- **VALIDATE**: Adapter tests copy `test-vault/` into `fs.mkdtemp` folders (never mutate the committed fixture): `listManaged` finds the fixture note; `read` returns its body and front matter; `patchFrontMatter` applies a field when the expectation matches and reports `conflictingFields` (leaving the file unchanged for that field) when it does not; `create` avoids a name clash; store `writeFileAtomic` leaves no `.tmp` file; secrets round trip. `src/scenario.test.ts`: through `createTestClient(copyOfTestVault)`, `ping` returns `ok: true`; `updateSettings` with `{ language: 'en-US' }` returns `ok: true`, writes `<copy>/.task-orchestrator/settings.json`, and a following `settings` query returns `en-US`. Then:
  ```bash
  node packages/test-client/src/cli.ts test-vault ping
  ```

#### Task 8.11 CREATE `test-vault/` fixture

- **IMPLEMENT**: `test-vault/Fixture note.md` with front matter `id: 6f1c2d9e-3b7a-4c1e-9f0a-2b8d4e6a1c33` and `type: reference`, body `This note is a fixture for the development vault and the automated tests.`; `test-vault/.obsidian/app.json` `{}`; `test-vault/.obsidian/community-plugins.json` `["task-orchestrator"]`; `test-vault/.obsidian/plugins/task-orchestrator/.hotreload` (empty). (Created here rather than in Step 9 because the D2 scenario test needs it.)

#### Task 8.12 REMOVE the Step 6 demo and run the suppression loop

- **IMPLEMENT**: `git rm packages/core/src/demo.ts`. Then run the suppression loop: `grep -rnE "eslint-disable|@ts-expect-error" packages/ e2e-tests/ 2>/dev/null`; remove each by fixing code, or keep with a same-line reason; none may disable a security or `obsidianmd/*` rule. Run `/validate:validate` (its build and e2e sections will fail until Steps 9-10; at this step require tests, typecheck, lint and format to pass and report the others as "not yet configured").
- **VALIDATE**: `pnpm test && pnpm typecheck && pnpm lint && pnpm format:check`; `pnpm lint` output shows the boundary script ran.

#### Task 8.13 COMMIT Step 8

- **IMPLEMENT**: Stage every new file under `packages/core/src/core/`, `packages/core/src/settings/`, `packages/core/src/shared/`, `packages/core/src/index.ts`, `packages/core/package.json`, `packages/test-client/` (all files), `test-vault/` (the four files), `scripts/check-core-boundary.mjs`, `scripts/check-core-boundary.test.ts`, `vitest.config.ts`, `pnpm-lock.yaml`, `package.json` if changed; the `git rm` of `demo.ts` is already staged.
- **COMMIT**: `feat(core): add ports, operation registry, error model and settings schema`

---

### STEP 9 — THE PLUGIN PACKAGE

**Documentation research:** Obsidian docs on Manage plugin lifecycle, Settings, Migrate to declarative settings, Store secrets, Vault, Optimize plugin load time, Plugin guidelines; esbuild API (`external`, `format`, `target`, `metafile`, `context`, `onEnd`); `node_modules/obsidian/obsidian.d.ts` for every signature used.

#### Task 9.1 INSTALL plugin build dependencies

- **IMPLEMENT**: `pnpm add -D --save-exact --filter @task-orchestrator/plugin esbuild` and confirm `obsidian@1.14.4` is pinned exactly (the newest published types; NOTES C6). `pnpm add --filter @task-orchestrator/plugin "@task-orchestrator/core@workspace:*"`. The template's esbuild config imports `builtinModules` from `node:module`, so no extra package is needed. Ensure `esbuild` is in `allowBuilds`.

#### Task 9.2 UPDATE `packages/plugin/esbuild.config.mjs`

- **IMPLEMENT**: Keep the template's banner, entry, externals (`obsidian`, `electron`, the `@codemirror/*` and `@lezer/*` list, `...builtinModules`) and add `...builtinModules.map((moduleName) => \`node:${moduleName}\`)`. `bundle: true`, `format: 'cjs'`, `target: 'es2021'`, `treeShaking: true`, `outfile` the repository-root `main.js`, `logLevel: 'info'`. Production (`production` argument): `minify: true`, `sourcemap: false`, `metafile: true`, write `JSON.stringify(result.metafile)` to `<repo>/dist/esbuild-meta.json` (create `dist/`), then exit. Development: `sourcemap: 'inline'`, watch, and an `onEnd` plugin that copies `main.js`, `manifest.json` and `styles.css` into `test-vault/.obsidian/plugins/task-orchestrator/` (via `scripts/copy-to-dev-vault.mjs`, so the copy logic is reusable). Root scripts: `"build": "pnpm typecheck && pnpm --filter @task-orchestrator/plugin run build"`, `"dev": "pnpm --filter @task-orchestrator/plugin run dev"`.
- **GOTCHA**: The directory scanner rebuilds `main.js` from the first of `build`, `build:plugin`, `compile` in the root `package.json` and compares it byte for byte; the production build must be deterministic (no timestamps in the banner). Copying output into the dev vault avoids a symlink from `test-vault/` back to the repository, which would make linters and test globs recurse.

#### Task 9.3 CREATE plugin settings `packages/plugin/src/settings/`

- **IMPLEMENT**:
  - `settings-state.ts`: `loadUserSettings(core, notifier)` runs the `settings` query (`actor: 'application'`) and returns the settings; on `loadStatus: 'corrupt'` it shows `notices.settingsUnreadable` once; on a failed query it returns `DEFAULT_USER_SETTINGS` and shows the code's notice. `saveSettingsChange(core, notifier, settingsChange)` runs `updateSettings` with `actor: 'user'` and returns the new settings, or shows the code's notice and returns `null` so the caller keeps the old value. The plugin keeps the latest settings in memory for the settings tab and `messagesFor`; nothing is read from or written to `data.json`.
  - `settings-tab.ts`: `TaskOrchestratorSettingTab extends PluginSettingTab`. `minAppVersion` 1.15.0 ≥ 1.13.0, so implement the declarative `getSettingDefinitions()` with one dropdown control for `language` (`UK English` / `US English`), names and descriptions from `messagesFor(settings.language)`, values read from the plugin's in-memory settings and written through `saveSettingsChange` via the tab's control-value hooks as `obsidian.d.ts` 1.14.4 defines them, saving on change. `getSettingDefinitions()` itself does no file reading (it must stay cheap). No `display()` (at a minimum of 1.13.0 or later, the linter's settings-tab rules expect the declarative form). No top-level heading, no heading at all (only one item), sentence case.
- **GOTCHA**: Read `SettingDefinitionItem`, `getSettingDefinitions`, `update()` and the control-value methods in the pinned `obsidian.d.ts` before writing; the linter's `settings-tab/*` rules enforce the declarative form at this `minAppVersion`.
- **VALIDATE**: `settings-state.test.ts` (fake core): a `valid` result returns its settings and shows no notice; a `corrupt` result returns defaults and shows `settingsUnreadable` exactly once; a failed query returns defaults and shows the code's notice; `saveSettingsChange` calls `execute` with `name: 'updateSettings'`, `version: 1`, `actor: 'user'` and the change as payload; a failed save shows the code's notice and returns `null`.

#### Task 9.4 CREATE `packages/plugin/src/adapters/`

- **IMPLEMENT** (one file per port, each a factory taking what it needs, never the global `app`):
  - `log-sink-adapter.ts`: `createObsidianLogSink(store: StorePort)`: writes `JSON.stringify(logEvent)` with `console.debug` for `debug`/`info`, `console.warn` for `warn`, `console.error` for `error`; [D3] also appends the line to `logs/application-YYYY-MM.jsonl` in the store (month from the event's `timestamp`; TAD 6.1 "A new file starts each month"; NOTES C17). Appends run through one internal promise chain so `write` stays synchronous and nothing floats; a failed append writes one `console.error` and keeps the chain alive. Exposes `flush(): Promise<void>`, called from a `this.register(...)` disposer on unload.
  - `clock-adapter.ts`: `now()` → `new Date()`; `timezone()` → `Intl.DateTimeFormat().resolvedOptions().timeZone`.
  - `notifier-adapter.ts`: `notice(message)` → `new Notice(message)`.
  - `secrets-adapter.ts`: `createObsidianSecretsAdapter(app)`: uses `app.secretStorage` (1.11.4+) methods as typed in `obsidian.d.ts`; when `secretStorage` is absent, `get` returns `null`, `set` returns `{ status: 'unavailable' }` and nothing is written anywhere (never plaintext in `data.json`; NOTES C15). Feature-detect without a cast, e.g. by reading the property through a `Partial<Pick<App, 'secretStorage'>>`-typed view.
  - `write-queue.ts`: `createPerFileWriteQueue()` with `runExclusive(file: TFile, work: () => Promise<T>): Promise<T>` built on a `WeakMap<TFile, Promise<unknown>>` (TAD 2.4 design cue from TaskNotes; keyed by the `TFile` object, which survives renames). A rejected job does not block later jobs.
  - `vault-adapter.ts`: `createObsidianVaultAdapter({ app, registerEvent, writeQueue, logger })`: `listManaged` from `vault.getMarkdownFiles()` and `metadataCache.getFileCache(file)?.frontmatter` (notes with a string `id`); `read` uses `vault.cachedRead` and `getFrontMatterInfo(text).contentStart` to split the body; `patchFrontMatter` runs `fileManager.processFrontMatter` inside `runExclusive`, applying each field only when `frontMatterValuesEqual(current, expected)` holds, removing it for `null`, and reporting conflicts; `replaceContent` uses `vault.process` with the same body comparison; before either write, if a `MarkdownView` in `workspace.getLeavesOfType('markdown')` has this file open and `view.editor.getValue()` differs from `await vault.read(file)`, return `{ status: 'deferred', reason: 'open_with_unsaved_changes' }` (TAD 2.4); `create` uses `fileManager.getNewFileParent('')`, a sanitised title, ` 2`/` 3` suffixes when the path exists, `vault.create` with the body, then `processFrontMatter` to write fields (never hand-written YAML); `rename` uses `fileManager.renameFile`; `trash` uses `fileManager.trashFile`; `resolveLink` uses `metadataCache.getFirstLinkpathDest`; `onChange` registers `metadataCache.on('changed')`, `vault.on('rename')`, `vault.on('delete')` through `registerEvent`, wraps the listener in `try`/`catch` (logging `plugin.vault.change_handler_failed`), and returns an unsubscribe calling `offref`. Every path goes through `normalizePath`; every file check is `instanceof TFile`.
  - `store-adapter.ts`: `createObsidianStoreAdapter(app)` over `app.vault.adapter` (the store is a hidden folder Obsidian's vault index does not see, so the low-level adapter API is the right tool for it); root `.task-orchestrator/` via `normalizePath`; `writeFileAtomic` writes `<path>.tmp` then `adapter.rename`; if `rename` rejects because the target exists, `adapter.remove` the target and rename again (record this fallback in TSDoc); `appendLine` creates missing folders (`adapter.exists`/`mkdir`) then `adapter.append`; `readFile` returns `missing` when `adapter.exists` is false.
  - `index.ts`: `createObsidianAdapters(plugin)` builds all six and returns `CoreAdapters` plus the log sink's `flush`.
- **GOTCHA**: Size limits: split any file approaching 300 lines (the vault adapter is the likeliest). `@typescript-eslint/no-unnecessary-condition` flags checks the types say are always true; feature detection must go through a typed optional view, not a disable comment. Do not iterate all files to find one by path (`vault/iterate`); finding by front-matter `id` is a deliberate full scan until the index slice exists (TAD 2.4 "The index and the checkpoint").
- **VALIDATE**: tests against the shim: `patchFrontMatter` treats an expected `null` as "field absent", treats an array that differs only in order as a conflict, and applies the matching field when one of two conflicts; a note open with unsaved changes returns `deferred` and is not written; the write queue runs two jobs on one file strictly one after the other and two files in parallel; a rejected job does not block the next; the secrets adapter returns `unavailable` and writes nothing when `secretStorage` is absent; the vault adapter applies a matching field and reports a conflicting one (fake `processFrontMatter`); the log sink routes levels to the right console method and appends to the month file.

#### Task 9.5 CREATE `packages/plugin/src/commands.ts` and UPDATE `src/main.ts`

- **IMPLEMENT**:
  - `commands.ts`: `registerCommands(commandHost: Pick<Plugin, 'addCommand'>, core: Core, getMessages: () => MessageCatalogue, notifier: NotifierPort)`: one command `{ id: 'ping', name: messages.commands.pingName, callback }` (no hotkeys; the plugin ID is not in the command ID). The callback runs `core.execute({ name: 'ping', version: 1, actor: 'user', payload: {} })` inside `try`/`catch`; `ok: true` → `notices.pingSucceeded`; `ok: false` → `errorNotices[errorCode]` or `notices.operationFailed(errorCode)`. Handle the promise with `void runPing().catch(…)` or an `async` callback whose rejections are caught, so nothing floats.
  - `main.ts`: lifecycle only. `onload`: build adapters, `createCore`, load settings with `loadUserSettings`, `registerCommands`, `addSettingTab`, `register(() => logSinkFlush())`, log `plugin.lifecycle.load_completed`; `this.app.workspace.onLayoutReady(() => { … })` holds anything expensive (nothing yet besides `plugin.lifecycle.layout_ready` log). `onunload`: nothing by hand. `onExternalSettingsChange`: reload settings with `loadUserSettings` (cheap; settings changed by a sync tool in `settings.json` are otherwise picked up at the next load until the vault slice watches the store). No ribbon icon. Load and unload are idempotent (no module-level state).
- **VALIDATE**: `commands.test.ts`: the registered callback calls `execute` with `actor: 'user'`, `name: 'ping'`, `version: 1`; a successful result shows the success notice; a failed result shows the code's notice; a rejected `execute` shows `operationFailed` and does not throw.

#### Task 9.6 UPDATE `styles.css` and the shim

- **IMPLEMENT**: `styles.css` stays empty apart from a comment that class names are prefixed `task-orchestrator-`. Grow `__mocks__/obsidian.ts` only with what the plugin tests touch (`TFile.path`, `getFrontMatterInfo`, `PluginSettingTab` constructor shape).

#### Task 9.7 VALIDATE the build and the plugin in the development vault, then commit

- **VALIDATE**:
  ```bash
  pnpm build
  test -f main.js && grep -c 'require("obsidian")' main.js     # ≥ 1: obsidian is required at runtime
  python3 -I -c "import json; m=json.load(open('dist/esbuild-meta.json')); bad=[p for p in m['inputs'] if '/obsidian/' in p or 'electron' in p or '@codemirror' in p]; assert not bad, bad; print('nothing external bundled')"
  pnpm test && pnpm typecheck && pnpm lint && pnpm format:check
  ```
  Manual (ask the owner, or use the Obsidian CLI if installed): run `pnpm dev` once, open `test-vault/` in Obsidian 1.15.0, enable community plugins, enable Personal Task Orchestrator, run "Check that the application core responds" from the command palette, see the notice, open the settings tab, switch language, disable and re-enable the plugin, and confirm the developer console shows no errors. Confirm `test-vault/.task-orchestrator/settings.json` holds the chosen language and `test-vault/.task-orchestrator/logs/application-YYYY-MM.jsonl` holds JSON lines with no `null` correlation ID.
- **IMPLEMENT**: suppression loop (as in Task 8.12), then `/validate:validate` (e2e still unconfigured).
- **COMMIT**: stage `packages/plugin/` files, `__mocks__/obsidian.ts`, `scripts/copy-to-dev-vault.mjs`, `styles.css`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` if changed. Message: `feat(plugin): add plugin lifecycle, port adapters, settings and production build`

---

### STEP 10 — TESTS INSIDE A REAL OBSIDIAN

**Documentation research:** `wdio-obsidian-service` README (3.5.0), browser-commands API, the sample plugin's `wdio.conf.mts`, `test.yaml` and `check_for_new_obsidian.yaml`.

#### Task 10.1 INSTALL WebdriverIO and the service

- **IMPLEMENT**: `pnpm add -D -w wdio-obsidian-service wdio-obsidian-reporter @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/globals mocha @types/mocha` (WebdriverIO 10.x; `wdio-obsidian-service` 3.5.0 supports it). Add any build-script package pnpm reports to `allowBuilds` deliberately.

#### Task 10.2 CREATE `e2e-tests/wdio.conf.mts` and `e2e-tests/tsconfig.json`

- **IMPLEMENT**: Adapt the sample's config: `cacheDir = path.resolve(repositoryRoot, '.wdio-obsidian-cache')` (the Day-0 ignore name); versions from `parseObsidianVersions(env.OBSIDIAN_VERSIONS ?? 'earliest/earliest latest/latest', { cacheDir })`; one desktop capability per version with `browserName: 'obsidian'` and `'wdio:obsidianOptions': { appVersion, installerVersion, plugins: [repositoryRoot], vault: path.join(repositoryRoot, 'test-vault') }`; **no mobile capabilities** (D1); no beta versions (needs an Insiders account); `specs: [path.join(import.meta.dirname, '**/*.e2e.ts')]`; `services: ['obsidian']`; `reporters: ['obsidian']`; Mocha `bdd` with 60-second timeout; `injectGlobals: false`; when `env.CI`, print `obsidian-cache-key:` with the resolved versions. `repositoryRoot = path.resolve(import.meta.dirname, '..')`, so paths do not depend on the working directory. `tsconfig.json`: extends `../tsconfig.base.json`, `"types": ["node", "@wdio/globals/types", "@wdio/mocha-framework", "wdio-obsidian-service"]`, include `**/*.ts` and `*.mts`. Root scripts: `"e2e": "pnpm build && wdio run e2e-tests/wdio.conf.mts"`; extend root `typecheck` with `&& tsc --noEmit -p e2e-tests/tsconfig.json`.
- **GOTCHA**: `earliest` resolves to `minAppVersion` 1.15.0, which today is also `latest`, so both capabilities run 1.15.0 until Obsidian publishes a newer release; that is expected. The first run downloads official Obsidian builds into the cache (a large download) and opens Obsidian windows on the machine running it.

#### Task 10.3 CREATE `e2e-tests/smoke.e2e.ts`

- **IMPLEMENT**: `import { browser, expect, $ } from '@wdio/globals'; import { obsidianPage } from 'wdio-obsidian-service'; import { messagesFor } from '../packages/core/src/core/messages/index.ts';` and, with `beforeEach(() => obsidianPage.resetVault())`:
  1. The plugin is enabled: `browser.executeObsidian(({ plugins }) => Boolean(plugins.taskOrchestrator))`, or the documented equivalent for reading enabled plugins by id.
  2. `browser.executeObsidianCommand('task-orchestrator:ping')`; then `$('.notice')` contains `messagesFor('en-GB').notices.pingSucceeded`.
  3. The settings tab opens: open settings and select the `task-orchestrator` tab through `executeObsidian` (internal `app.setting` API, typed in the test through a small interface with a one-line comment saying it is internal and test-only); the tab's content contains `messagesFor('en-GB').settings.languageName`.
  4. Disable then re-enable produces no console errors: install a recorder for `console.error` in the page, disable and enable the plugin through `executeObsidian`, run `ping` again, assert the recorder is empty and the notice reappears exactly once.
  `[D1 default]` mobile emulation is **not** tested (D1 overridden).
- **GOTCHA**: e2e files are ignored by the scanner but linted by our config; type-aware rules apply.

#### Task 10.4 CREATE `.github/workflows/e2e.yml` and `check_for_new_obsidian.yml`

- **IMPLEMENT**:
  - `e2e.yml`: triggers `push` to `main`, `schedule` nightly (`cron: '17 3 * * *'`), `workflow_dispatch`. Job on `ubuntu-latest`: `actions/checkout@v7`, `pnpm/action-setup@v6`, `actions/setup-node@v7` with `node-version-file: .nvmrc` and `cache: pnpm`, `pnpm install --frozen-lockfile`, cache-key step (`node e2e-tests/wdio.conf.mts | grep 'obsidian-cache-key:' > obsidian-versions-lock.txt; rm -rf .wdio-obsidian-cache`; Node strips the types), `actions/cache` for `.wdio-obsidian-cache` keyed on `hashFiles('obsidian-versions-lock.txt')`, the sample's "Setup virtual graphics" step (Xvfb and herbstluftwm), then `pnpm e2e` with `WDIO_MAX_INSTANCES: 2`. `permissions: { contents: read }`.
  - `check_for_new_obsidian.yml`: the sample's daily workflow, with `workflow_id: 'e2e.yml'`, `ref: 'main'`, `permissions: { actions: write }`, and the current major of `actions/github-script`.
- **GOTCHA**: GitHub disables scheduled workflows after 60 days without repository activity.

#### Task 10.5 VALIDATE and commit

- **VALIDATE**: `pnpm e2e` passes locally against both capabilities; suppression loop; `/validate:validate`. Then ask the owner before pushing: `git push origin HEAD:e2e-smoke-check` (a throwaway branch); trigger `gh workflow run e2e.yml --ref e2e-smoke-check`; `gh run watch` until green; delete the remote branch after Step 10's commit lands on `main` and is pushed (also with the owner's approval).
- **COMMIT**: stage `e2e-tests/` files, `.github/workflows/e2e.yml`, `.github/workflows/check_for_new_obsidian.yml`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` if changed. Message: `test(e2e): add real-Obsidian smoke tests at the minimum and latest versions`

---

### STEP 11 — RELEASE AUTOMATION AND DIRECTORY READINESS

**Documentation research:** Obsidian's "Release your plugin with GitHub Actions", "Submit your plugin" and submission requirements; `actions/attest` README; GitHub artifact-attestation availability; `obsidianmd/obsidian-workflows` README.

#### Task 11.1 UPDATE `scripts/version-bump.mjs` and `.npmrc`

- **IMPLEMENT**: Keep the template logic (copy `npm_package_version` into `manifest.json`; add `versions.json[newVersion] = minAppVersion` when absent) and also write the same version into each `packages/*/package.json` so all versions agree; tab-indented output with a trailing newline. `.npmrc` keeps `tag-version-prefix=""` (an npm setting). The bump command is `npm version patch|minor|major` from a clean tree (npm ships with Node and runs the root `version` script); document it in `CLAUDE.md` at Step 12.

#### Task 11.2 CREATE `scripts/check-manifest.mjs`

- **IMPLEMENT**: Dependency-free; exits 1 with one line per violation: required keys and types (`id`, `name`, `version`, `minAppVersion`, `description`, `author` strings; `isDesktopOnly` boolean), no other keys except `authorUrl`/`fundingUrl`; `id` matches `^[a-z-]+$`, no `obsidian`, not ending `plugin`; `name` has no "Obsidian"/"Obsi"/"sidian"/"Plugin", Basic Latin letters, digits, spaces and `-+()` only; `description` 10-250 characters, starts with a capital, ends with a period, no emoji, does not start with "This is a plugin"; `version` and `minAppVersion` match `^\d+\.\d+\.\d+$`; `fundingUrl` absent or a non-empty URL other than `https://obsidian.md/pricing`; `authorUrl` not `https://obsidian.md`; `versions.json` valid JSON with an entry for the current version and every value `x.y.z`; root and package `package.json` versions equal the manifest version; `isDesktopOnly` is `true` (D1); `README.md`, `LICENSE`, `manifest.json` exist and `LICENSE` does not mention "Dynalist"; with `--tag <tag>`, the tag equals the manifest version. Root script `"check:manifest": "node scripts/check-manifest.mjs"`.
- **VALIDATE**: `pnpm check:manifest`; then temporarily set the description to end without a period and confirm it fails; restore.

#### Task 11.3 CREATE `scripts/check-bundle-size.mjs`

- **IMPLEMENT**: Reads `dist/esbuild-meta.json`, takes the `bytes` of the output ending `main.js`, fails above `BUNDLE_SIZE_BUDGET_BYTES = 1_048_576` (1 MB) and then prints the ten largest inputs. Root script `"check:size": "node scripts/check-bundle-size.mjs"`.
- **VALIDATE**: `pnpm build && node scripts/check-bundle-size.mjs`

#### Task 11.4 CREATE `.github/workflows/ci.yml` and REMOVE `lint.yml`

- **IMPLEMENT**: `git rm .github/workflows/lint.yml`. `ci.yml` on every `push` and `pull_request`, `permissions: { contents: read }`: checkout v7, `pnpm/action-setup@v6`, `setup-node@v7` (`node-version-file: .nvmrc`, `cache: pnpm`), then `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm check:manifest`, `node scripts/check-bundle-size.mjs`, `pnpm audit --audit-level=high`. A second job runs `uses: obsidianmd/obsidian-workflows@v1` with `scanner-lint: true`, `node-version: 26` and the inputs its README requires for a plugin in pull-request mode.

#### Task 11.5 REWRITE `.github/workflows/release.yml`

- **IMPLEMENT**: Trigger `push: tags: ['*']`; `permissions: { contents: write, id-token: write, attestations: write }`; checkout, pnpm, setup-node from `.nvmrc`; `pnpm install --frozen-lockfile`; `node scripts/check-manifest.mjs --tag "${GITHUB_REF#refs/tags/}"`; `pnpm build`; **three separate** `actions/attest@v4` steps, one each for `main.js`, `manifest.json` and `styles.css` (a bundled attestation failed verification in a reported 2026 case); `gh release create "$tag" --title "$tag" --draft main.js manifest.json styles.css` (files attached individually, never zipped).

#### Task 11.6 CREATE `.github/dependabot.yml` and `NOTICES.md`

- **IMPLEMENT**: Dependabot `version: 2`, `package-ecosystem: npm` at `/` weekly (works with `pnpm-lock.yaml`), and `github-actions` at `/` weekly. `obsidian` and `eslint-plugin-obsidianmd` stay pinned exactly so every bump is a deliberate pull request. `NOTICES.md`: a "Bundled third-party code" section listing each production dependency bundled into `main.js` today (Zod, MIT, with its copyright line and the MIT text) and a "Copied plugin code" section stating that none is copied yet (TAD 2.6 adds TaskNotes, QuickAdd, FileClass, Conditional Properties and TaskNotes Workflows notices when their code is copied). Template code is 0BSD and needs no attribution.

#### Task 11.7 VALIDATE release readiness, then commit

- **VALIDATE**: `pnpm check:manifest && node scripts/check-bundle-size.mjs`; suppression loop; `/validate:validate`. With the owner's approval: push a branch and confirm `ci.yml` is green (`gh run watch`). Dry-run release, with the owner's approval: on a throwaway branch set version `0.0.1` in every `package.json` and in `manifest.json`, add `"0.0.1": "1.15.0"` to `versions.json`, commit on that branch, tag `0.0.1`, push branch and tag, wait for `release.yml`, then:
  ```bash
  gh release view 0.0.1 --json tagName,isDraft,assets --jq '{tagName,isDraft,assets:[.assets[].name]}'
  gh release download 0.0.1 -p main.js -D "$SCRATCH/release-check" && gh attestation verify "$SCRATCH/release-check/main.js" -R rahulpdev/task-orchestrator
  ```
  Expected: draft, three assets named `main.js`, `manifest.json`, `styles.css`, attestation verifies. Then delete the draft release (`gh release delete 0.0.1 --yes`), the remote and local tag, and the throwaway branch (each deletion confirmed with the owner).
- **COMMIT**: stage `scripts/version-bump.mjs`, `scripts/check-manifest.mjs`, `scripts/check-bundle-size.mjs`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/dependabot.yml`, `NOTICES.md`, `package.json`, `packages/*/package.json` if changed; the `git rm` of `lint.yml` is staged. Message: `chore(release): add version bump, manifest and size checks, CI and attested release workflow`

---

### STEP 12 — README, GLOBAL RULES AND FINAL VALIDATION

**Documentation research:** read `.agents/templates/template_readme.md` and `.agents/templates/template_claude_md.md` in full before writing; Obsidian's developer policies on what the README must disclose.

`CLAUDE.md` is normative (every rule lives there and nowhere else); `README.md` is descriptive. Neither restates the other; each points to the other in one line where needed. Keep every template heading, its order and formatting; delete each template's comment block. Where a section has nothing to say, keep it with one line saying so. Both templates were written for a Python web service; replace Python-specific unbracketed text and examples with the TypeScript conventions this plan establishes (NOTES C7).

#### Task 12.1 CREATE `CLAUDE.md`

- **IMPLEMENT** (mapping by template section):

| Template section | Content for this repository |
|---|---|
| Title | `# Personal Task Orchestrator — Global Agent Rules` |
| 1. Core Principles | Keep the bold principle headings. Correlation-ID rule: "`correlationId` on every log line an operation writes; generated by `execute`/`query` when the caller supplies none, passed explicitly, omitted (never `null`) when unset". Type safety: "Explicit types on every exported function signature; `tsc` strict and typescript-eslint `strict-type-checked` must both pass; no `// eslint-disable` or `// @ts-expect-error` without a documented reason on the same line; never disable a security or `obsidianmd/*` rule". Docstrings: "TSDoc (`/** … */`) with `@param` and `@returns`". Security: keep, replacing "environment variables" with "Obsidian secret storage". |
| 2. Tech Stack | "Backend" = the application core and test client: TypeScript 5.x on Node 26 / inside Obsidian; pnpm 12; framework "none: Zod 4 schemas and the internal operation registry"; ORM "None. Notes are Markdown files reached only through the vault port"; logging "JSON Lines through the `LogSink` port"; database "None on the device; the local store is plain files in `.task-orchestrator/`"; lint/format "ESLint 10 + eslint-plugin-obsidianmd 0.5.1 (pinned) + Prettier 3 (tabs, single quotes, width 100)"; type checking "tsc strict + typescript-eslint strict-type-checked (both required)"; testing "Vitest 5 with coverage; wdio-obsidian-service 3.5". "Frontend" = the plugin: Obsidian plugin API (`obsidian` types pinned 1.14.4, `minAppVersion` 1.15.0, desktop only), esbuild bundle to `main.js`, declarative settings, Notices. |
| 3. Architecture | The workspace tree (root config files, `packages/core`, `packages/plugin`, `packages/test-client`, `__mocks__/`, `e2e-tests/`, `test-vault/`, `scripts/`, `.github/workflows/`) with `core/core` files, `shared/`, and the planned slices from TAD 2.3 (`capture`, `clarify`, `organise`, `structure`, `dashboard`, `review`, `lint`, `vault`, `export-import`, `settings`, `licensing`, `paid-service`). Rules: the core never imports Obsidian, Electron or a Node module; `core/core` never imports a slice or `shared/`; `shared/` holds only code used by three or more slices; slices never import each other's internals; `main.ts` does lifecycle only; process model "one plugin bundle (`main.js`) loaded by Obsidian; one command-line test client; the paid service lives in a separate private repository". |
| 4. Code Style | Size limits (files 300 lines, functions 50 lines). Naming rules from Patterns to Follow. A TSDoc example. "ORM models — always use shared mixins": replace the heading's content with one line: "Not applicable: there is no ORM. Front-matter field names stay exactly as the PRD fixes them." Schemas: a Zod schema example (`PascalCase` + `Schema` suffix, `z.infer`). Plus the `.ts`-extension import rule and the no-enum rule. |
| 5. Logging | The logging convention from Patterns to Follow and Task 6.3 (one JSON object per line with `event`, `level`, `timestamp` and an optional `correlationId`; three-part event names; a start and completion or failure pair per operation; no note content or secrets), with TypeScript examples; domain list per D4; correlation-ID setting and clearing. |
| 6. Testing | A table of test types, locations and runners (core unit beside the code with no shim, plugin unit with the shim, test-client scenario, real Obsidian at `earliest` and `latest`); test names `describe` the function, `it` states condition and result; core tests use in-memory adapters and a pretend clock. |
| 7. Error Handling | Error-code format `{DOMAIN}_{CATEGORY}_{DETAIL}` with the D4 domain list; `Result` and `AppError` shapes; failures are values inside the core; handlers never throw; user notices from the messages catalogue; no floating promises. |
| 8. Common Patterns | One line: "None yet. Reference material for recurring patterns is added under `.agents/reference/` as slices are built." |
| 9. Development Commands | The commands under VALIDATION COMMANDS (`pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e`, `pnpm check:manifest`), plus `pnpm install`, `pnpm dev` (copies the build into `test-vault/`), `node packages/test-client/src/cli.ts <vault> ping`, `npm version patch` for releases, and the dependency rule (never edit dependency lists by hand). Database and container lines: "None in this repository." |
| 10. Human Communication Rules | Keep as written. |
| 11. AI Agent Instructions | Rebuild the list from the sections present; replace "Apply all shared mixins" with "Keep the core free of host imports (the boundary check enforces it)". |

#### Task 12.2 CREATE `README.md`

- **IMPLEMENT** (mapping): one-sentence description = the first sentence of the manifest description; badges for TypeScript, Node 26, pnpm, Obsidian 1.15.0+, Vitest, and `license-Elastic--2.0`. Overview: what the application will do (the full manifest description) and that this version is the foundation with one diagnostic command; Key Features: only what exists (internal API with `ping`, structured JSON logs with `correlationId`, the language setting, desktop-only); Architecture: a box diagram of plugin → core → ports → vault/store, and the test client; Getting Started: prerequisites (Node 26, pnpm 12, Obsidian 1.15.0+, Git) and the install steps pointing to `CLAUDE.md` Section 9 (no `.env` step: "No environment file is needed"); Running the Services: `pnpm dev` with the development vault; "Health checks" = the `ping` command and the test-client CLI; API Reference: the internal API calling shape (`execute`/`query`, `Result`), the `ping` operation as the one entry, the `CORE_*` error-code table with Retryable and Meaning (HTTP column: "—", the API is in-process); CLI Usage: the test client; Testing: pointer to `CLAUDE.md` 6 and 9; Configuration: the settings table (language) and the local store folder, with one line that there are no environment variables; FAQs: where logs are (`.task-orchestrator/logs/application-YYYY-MM.jsonl` and the developer console); Contributing; License: Elastic License 2.0 in one sentence plus "third-party licences are listed in `NOTICES.md`". **Disclosures required by the developer policies, stated as the code behaves today:** network use: none; accounts: none; payment: none; files outside the vault: none (the plugin writes a hidden `.task-orchestrator/` folder inside the vault); telemetry: none; third-party licences: `NOTICES.md`. No speculative claims about paid features beyond one sentence that a paid plan is planned and will be disclosed here before release.

#### Task 12.3 UPDATE `.claude/commands/validate/validate.md`

- **IMPLEMENT**: Replace "currently N tests" with the real passing count from `pnpm test`, the real execution time bound, `pnpm check:manifest` and `node scripts/check-bundle-size.mjs` lines unchanged, and name the packages (`@task-orchestrator/core`, `@task-orchestrator/plugin`, `@task-orchestrator/test-client`) in the type-checking expectation.

#### Task 12.4 VALIDATE end to end and commit

- **VALIDATE**: `pnpm format:check` (README and CLAUDE.md are formatted); suppression loop; `/validate:validate` passes every section; `pnpm e2e` passes.
- **COMMIT**: stage `README.md`, `CLAUDE.md`, `.claude/commands/validate/validate.md`. Message: `docs: add README and global development rules (CLAUDE.md)`

---

## TESTING STRATEGY

Every test is specified in the VALIDATE line of the task that creates the code it tests; there are no others.

---

## VALIDATION COMMANDS

Run once all tasks are done:

```bash
/validate:validate                                   # tests, typecheck, lint, format, build, bundle, manifest, e2e
grep -rnE "eslint-disable|@ts-expect-error" packages/ e2e-tests/   # every hit carries a same-line reason; none disables a security or obsidianmd rule
node packages/test-client/src/cli.ts test-vault ping
gh run list --workflow ci.yml --limit 1              # green
gh run list --workflow e2e.yml --limit 1             # green
```

Then repeat the manual check in Task 9.7.

---

## ACCEPTANCE CRITERIA

- [ ] `pnpm lint`, `pnpm format:check` and `pnpm typecheck` report zero issues in every package.
- [ ] `pnpm test` passes with coverage reported; core line coverage ≥ 80%.
- [ ] `pnpm e2e` passes against `earliest` (1.15.0) and `latest`.
- [ ] The suppression search returns nothing unjustified; nothing disables a security or `obsidianmd/*` rule.
- [ ] `pnpm build` produces `main.js` at the root with no Obsidian, Electron, CodeMirror or Node code bundled, within 1 MB.
- [ ] `packages/core` has no dependency on and no mention of `obsidian`; the boundary check proves it and fails on a planted import.
- [ ] The plugin loads in the development vault, `ping` works, disable/enable leaves no console error.
- [ ] `pnpm check:manifest` passes; CI and the release workflow are green; a draft release carried three individually attested assets.
- [ ] Every log line is one JSON object with a three-part event name; no line carries a `null` correlation ID, note content or a secret.
- [ ] `README.md`, `CLAUDE.md` and `manifest.json` describe the repository as it is, with every required disclosure.
- [ ] One commit per step, in sequence, each passing validation when made.
- [ ] This plan's Decision Register is recorded (above) and its NOTES questions answered or accepted by the owner.

---

## NOTES

### Questions recorded with assumed answers (the plan proceeds on the assumption; the owner may overturn it at approval)

- **Q1. Manifest name and author.** Neither the PRD nor the TAD fixes them. Assumed: name `Personal Task Orchestrator`, author `Rahul Parmar`. The name can change later; the `id` cannot. The description was set by the owner.
- **Q2. Approval to install pnpm globally** (`npm install -g pnpm@12`). Assumed: yes, asked once at Task 0.2.

### Conflicts found during planning, with the resolution used

- **C1. The copied `.gitignore` was Python-oriented.** It lacked `node_modules/`, `main.js`, `coverage/`, the test-vault and wdio entries and `.agents/reports/`. Resolution: replaced with Node, pnpm and Obsidian plugin entries before execution; Task 1.1 only confirms it.
- **C2. The repository has no commits yet.** It is initialised on `main` with `origin` set to the public `rahulpdev/task-orchestrator`. The Step 1 commit is its first, so the "initial commit" message fits, and no second `git init` happens.
- **C3. The PRD and TAD stay out of git.** The repository is public and named `task-orchestrator`, as TAD E18 and PRD 9 require, which also makes GitHub artifact attestations available for the Step 11 dry run. The owner keeps the PRD and TAD private: `.gitignore` lists `.agents/PRD.md` and `.agents/TAD.md`, so they stay on disk and are never staged.
- **C4. Node version.** TAD 2.7 says Node 22 because it was "the current long term support release". The rule is the current long-term-support release, which on 2026-11-10 is Node 26. Resolution: Node 26.
- **C5. TypeScript version.** TypeScript 5.x is required; npm's `latest` is 7.0.2, which typescript-eslint 8 (peer `<6.1.0`) and the Obsidian linter do not support. Resolution: newest 5.x.
- **C6. `obsidian` types lag the app.** The `obsidian` types package should match `minAppVersion` or later; the newest published types are 1.14.4 while the minimum app is 1.15.0. Resolution: pin 1.14.4 exactly; use no API newer than its `@since` tags; Dependabot proposes 1.15.x when published.
- **C7. Templates are written for a Python web service.** Their unbracketed text includes Python rules (`# type: ignore`, Google docstrings, ORM mixins, pytest examples, env variables, HTTP health endpoints). Their shape must be kept exactly, while the rules they carry must be this plan's TypeScript ones. Resolution: keep every heading, order and format; replace Python-specific text with the TypeScript equivalent (Step 12 mapping table); keep sections without an equivalent with a one-line statement.
- **C8. Correlation-ID format.** TAD 2.7 chooses ULIDs for audit-log entries and correlation IDs; this plan's identifier rule (Step 6) is `crypto.randomUUID()`. Resolution: UUIDs now (no extra dependency); `newCorrelationId()` is the single place to switch to ULIDs when the vault-audit-log slice arrives.
- **C9. Where user settings live.** The usual plugin pattern keeps settings in Obsidian's own `data.json` through `loadData`/`saveData`; PRD F14.3 and TAD 8.4 put them in `.task-orchestrator/settings.json`, with only the store layout version in `data.json`. Resolution: settings go into the local store from the start, through the `settings` query and `updateSettings` operation of a small settings slice (Task 8.5), so no later move is needed. The foundation does not use `data.json`. Building this slice now is a small exception to adding feature slices only after the foundation; it holds only the `language` setting, and the rest of PRD F14.1 arrives with Feature 14.
- **C10. Obsidian rule set scope.** The Obsidian rule set could be applied to the plugin package only, but the directory scanner lints every non-ignored file in the repository, including the core and test client. Resolution: apply it to every package so local lint matches the scanner.
- **C12. Slice-import rule.** Step 4 needs a rule forbidding imports of another slice's internals. ESLint's `no-restricted-imports` cannot resolve relative paths reliably for this; the rule is implemented in `scripts/check-core-boundary.mjs` (created in Step 4, extended in Step 8) and run by `pnpm lint`. Imports of `obsidian`, Electron, CodeMirror, Lezer and Node built-ins stay ESLint rules.
- **C13. Port names and scope.** The notice port could be called `NoticePort`; TAD 3.2 names `NotifierPort` (with `systemNotification`), adds `timezone()` to `ClockPort` and lists a `PaidServicePort`. Resolution: TAD names and functions for every port this foundation builds (`NotifierPort.notice`, `ClockPort.now/timezone`); `systemNotification` and `PaidServicePort` are added by the date-alerts and paid-service slices (PRD D8 forbids network use before a trial anyway).
- **C14. The core's public surface.** The core's `index.ts` was to export only `createCore`, returning `{ execute, query }`. The plugin needs the default settings to fall back on when the settings query fails, both vault adapters need one shared conflict rule (`frontMatterValuesEqual`), hosts need to write log lines in the core's format and show words from the one messages module. Resolution: runtime exports `createCore`, `frontMatterValuesEqual` and `DEFAULT_USER_SETTINGS`; `Core` adds `logger` and `messagesFor`; types are exported for adapters. TAD 3.1 shows queries returning `result`; one `Result` type with `outcome` serves both.
- **C15. Secret-storage fallback.** A fallback is required for when secret storage is absent; with `minAppVersion` 1.15.0 every supported Obsidian has it (since 1.11.4). Resolution: the fallback reports `unavailable` and stores nothing, never plaintext (PRD NFR 4, TAD 8.5).
- **C16. Layout differences.** TAD 2.3 shows `core/ports/`, `core/api/` folders and `fixtures/vaults/`; this plan uses `core/ports.ts`, `core/api.ts` and `test-vault/`. Resolution: this plan's layout now; a file that outgrows 300 lines becomes the TAD's folder; `fixtures/vaults/` arrives with the fixture generator. The messages catalogue goes in `core/core/messages/` as TAD 2.3 places it.
- **C17. Application log file name.** TAD 3.3 shows `logs/application.jsonl`; TAD 6.1 says a new file starts each month and three months are kept. Resolution: `logs/application-YYYY-MM.jsonl`; the three-month clean-up arrives with the vault slice.
- **C18. ESLint 10 peer warnings.** `eslint-plugin-obsidianmd` 0.5.1 bundles plugins that have not declared ESLint 10 support; its README says linting still works. Accepted and recorded in the Step 2 commit.

### Design decision

- **`ping` is an operation, not a query**, because the plugin unit test requires `execute` with `actor: 'user'`; it changes nothing.

### Risks

- The Obsidian linter's rule semantics change between minor versions; it is pinned at 0.5.1 and should be re-run against the latest before first submission.
- Real-Obsidian tests depend on a single-maintainer project and on Linux virtual graphics in CI.
