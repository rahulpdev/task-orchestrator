# Obsidian community plugin development: reference

**Verification — research conducted 10 October 2026, document written 11 October 2026.** Current public Obsidian is **1.14.4** (desktop and mobile). The `obsidian` TypeScript type package is **1.14.4** at [obsidian-api `9abd960`](https://github.com/obsidianmd/obsidian-api/tree/9abd9605ce081383674aae1ed111c456edde0688). The developer documentation site is built from [obsidian-developer-docs `c56c7e7`](https://github.com/obsidianmd/obsidian-developer-docs/tree/c56c7e770ba25dd0ea392aacf4588f9425970d36) (10 August 2026). The official template is [obsidian-sample-plugin `07ceb81`](https://github.com/obsidianmd/obsidian-sample-plugin/tree/07ceb81d1fb3384af611ebf665a1ec42a7e5926d). The official linter `eslint-plugin-obsidianmd` is **0.4.2** on npm (24 August 2026), repository [obsidianmd/eslint-plugin `837b01d`](https://github.com/obsidianmd/eslint-plugin/tree/837b01dc1647cb3f0c532becb60ea83bec137656). Every repository reference in this document names the commit inspected so the link stays valid when the code moves on.

**Limits and assumptions.** Nothing was installed, built or run; code was read, not executed. Obsidian's Discord was not accessible, so anything said only there is absent. The community directory's server-side scanner is closed source; only its published ESLint half is known exactly. Forum posts are attributed to their authors and dated; staff status of forum posters is stated only where the obsidian.md "About" page confirms it. Where official text and official tooling disagree, both are reported and the operative rule is stated. This document makes no product or architecture decision; it describes what any community plugin must, should and may do.

**How to read the labels.**

- **Mandatory** — stated as a requirement in official text (docs.obsidian.md, obsidianmd repositories), or required for a listing in the community directory. Breaking it blocks publication or risks removal.
- **Scanner error** — an `error`-level rule in the directory's automated review. Errors make a release uninstallable until fixed.
- **Recommended (official)** — official guidance worded "should", "prefer" or "avoid". Reviewers "may still require you to address any violations".
- **Community** — practice observed in established plugins or stated by experienced developers, attributed. Not a requirement.
- **Uncertain** — official text is ambiguous or contradictory, or the fact could not be verified.

**Terms used throughout.** A *vault* is the folder of notes Obsidian opens. *Front matter* is the YAML block at the top of a note that holds properties. A *leaf* is one pane or tab in the Obsidian window; a *view* is what a leaf shows. The *manifest* is `manifest.json`, the file describing a plugin. The *community directory* is Obsidian's public catalogue at community.obsidian.md, from which users install plugins. The *scanner* is the directory's automated review. *Semantic versioning* means version numbers of the form `major.minor.patch`, for example `1.4.2`.

---

## 1. Overview and authoritative sources

### 1.1 What this document covers

This is a reference for developing, testing, publishing and maintaining an Obsidian community plugin that passes the directory's review and behaves well for users. It is written for an AI coding agent working from a separate product requirements document and architecture document. It covers the whole lifecycle: environment and project setup (section 3), implementation patterns (section 4), security and data safety (section 5), testing (section 6), submission (section 7), maintenance (section 8), reference code (section 9), a consolidated workflow and checklist (section 10), open questions (section 11) and a source register (section 12).

### 1.2 How sources were assessed

Five research workstreams ran in parallel: official requirements, submission and publication, community practice, reference implementations, and workflow and quality assurance. Each inspected primary sources directly: the developer documentation and its source repository, the TypeScript definitions, the official template and linter, the directory's FAQ and blog, forum threads from 2024 to 2026, and shallow clones of 25 plugin and tool repositories. Findings were then reconciled. Where two workstreams disagreed, the primary source was re-read. Repository popularity was not treated as evidence of quality; each selected repository was checked for strict TypeScript, lifecycle cleanup, tests, release automation, mobile handling and deprecated API use.

### 1.3 Precedence when sources conflict

1. **Developer policies and submission requirements** on docs.obsidian.md decide what can be listed. Source: [Developer policies](https://docs.obsidian.md/Community+directory/Developer+policies), [Submission requirements for plugins](https://docs.obsidian.md/Community+directory/Submission+requirements+for+plugins).
2. **The scanner's behaviour** decides whether a release installs. Its published half is the linter's "Community plugin scanner configuration". Source: [eslint-plugin docs/configuration.md](https://github.com/obsidianmd/eslint-plugin/blob/837b01dc1647cb3f0c532becb60ea83bec137656/docs/configuration.md).
3. **Reference pages** (Manifest, Versions) and the **TypeScript definitions** decide what the app accepts and what APIs exist. Source: [Manifest](https://docs.obsidian.md/Reference/Manifest), [Versions](https://docs.obsidian.md/Reference/Versions), [obsidian.d.ts](https://github.com/obsidianmd/obsidian-api/blob/9abd9605ce081383674aae1ed111c456edde0688/obsidian.d.ts).
4. **Plugin guidelines and guides** are recommendations that reviewers can enforce. Source: [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
5. **The official template** and its `AGENTS.md` show current practice but are not rules. Where the template disagrees with a reference page, the reference page wins (see the `author` field in section 2.3).
6. **Community practice** fills gaps the official sources leave open, chiefly automated testing and architecture.

### 1.4 The May 2026 change to publication

The way plugins are published changed on 12 May 2026. Before, a developer opened a pull request against the `obsidianmd/obsidian-releases` repository and waited, often months, for a human review. Now a developer submits through the community directory website, every release is scanned automatically within minutes, and human review is reserved for popular, featured or flagged plugins. The pull-request templates and validation workflow were deleted from `obsidian-releases` on 15 May 2026 and that repository's plugin list is now an hourly mirror of the directory. Older guides, blog posts and the template's own `AGENTS.md` still describe or link to the old process. Section 7 describes the current one. Source: [The future of Obsidian plugins (kepano, 12 May 2026)](https://obsidian.md/blog/future-of-plugins/); [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin); obsidian-releases commits `d4f069442f` and `afc1210209` (15 May 2026) and workflow [`mirror-community-json.yml`](https://github.com/obsidianmd/obsidian-releases/blob/master/.github/workflows/mirror-community-json.yml).

---

## 2. Official development requirements

### 2.1 Developer policies (Mandatory)

These apply to every plugin listed in the directory. "Plugins and themes that don't follow these policies will be removed from the directory." Source: [Developer policies](https://docs.obsidian.md/Community+directory/Developer+policies).

**Never allowed.** A plugin must not: obfuscate code to hide its purpose; insert dynamic advertisements loaded over the internet; insert static advertisements outside its own interface; include client-side telemetry (usage tracking that runs inside the app); install or update itself or its dependencies.

**Allowed only when clearly stated in the README.** Payment required for full access. An account required for full access. Network use, explaining "which remote services are used and why they're needed". Accessing files outside the vault, explaining why. Static advertisements inside the plugin's own interface. Server-side telemetry, which must link to a privacy policy. Closed-source code, "handled on a case by case basis"; the May 2026 blog adds that new closed-source plugins are not being accepted "for now".

**Copyright and licensing.** Include a `LICENSE` file and clearly indicate the licence. Comply with the licences of code the plugin uses, "including attribution in the README if required". Respect the Obsidian trademark: the name must not suggest the plugin is made by Obsidian.

**Forks.** A fork of another plugin is not allowed unless the original author gave public written approval, or the original is unmaintained for six months and the author did not respond within 30 days of a public notice. The original author must be credited. A project that diverges "should inherit no code from the original repo without explicit permission".

**Removal.** For a violation, Obsidian may give a timeframe to fix, then remove the plugin. Immediate removal follows malicious behaviour, an uncooperative developer or repeat violations. Unmaintained or severely broken plugins may also be removed.

### 2.2 Submission requirements (Mandatory)

These extend the policies for plugins. Source: [Submission requirements for plugins](https://docs.obsidian.md/Community+directory/Submission+requirements+for+plugins).

- `fundingUrl` only if the author accepts donations; otherwise remove it from the manifest. The template ships `"fundingUrl": "https://obsidian.md/pricing"` as a placeholder, which must be replaced or deleted.
- `minAppVersion` set to the real minimum compatible Obsidian version; if unknown, "use the latest stable build number".
- Description: start with an action statement ("Translate selected text into…"), not "This is a plugin"; 250 characters maximum; end with a period; no emoji or special characters; capitalise proper nouns correctly ("Obsidian", "Markdown", "PDF").
- If the plugin uses any Node.js or Electron API (`fs`, `crypto`, `os` and so on), "you **must** set `isDesktopOnly` to `true`". Web alternatives exist: `SubtleCrypto`, `navigator.clipboard`.
- Do not put the plugin ID in command IDs; Obsidian prefixes it automatically.
- Remove all sample code from the template before submission.

### 2.3 Manifest and versions files

**Manifest (Mandatory).** `manifest.json` sits at the repository root and inside every release. Required keys for a plugin: `id`, `name`, `version`, `minAppVersion`, `description`, `author`, `isDesktopOnly`. Optional: `authorUrl`, `fundingUrl` (a URL string, or an object mapping labels to URLs). Source: [Manifest](https://docs.obsidian.md/Reference/Manifest).

| Key | Rule | Source |
|---|---|---|
| `id` | Lowercase letters and hyphens only. Must not contain `obsidian`. Must not end with `plugin`. Unique across the directory. Cannot be changed after publication: changing it "resets all downloads" and forces every user to reinstall. For local development the plugin folder name must equal the id, or some callbacks such as `onExternalSettingsChange` are not called. | Manifest; [FAQ](https://docs.obsidian.md/Community+directory/FAQ) |
| `name` | Short, English, Basic Latin characters. No punctuation except hyphen, plus sign and parentheses; no emoji. Must not include "Obsidian" or variants such as "Obsi-" or "-sidian". Must not include the word "Plugin". Must not be the name of a core feature. Unique. Can be changed later by editing the manifest; an invalid new name delists the plugin until fixed. | Manifest |
| `version` | Semantic versioning in the form `x.y.z` only. | Manifest; Submit your plugin |
| `minAppVersion` | The oldest Obsidian version the plugin works on. The linter rule `no-unsupported-api` reports any API newer than this value. | Submission requirements; eslint-plugin README |
| `description` | See section 2.2. | Submission requirements |
| `isDesktopOnly` | `true` whenever Node.js or Electron APIs are used. | Submission requirements |
| `fundingUrl` | Only if accepting donations; object values must be non-empty strings. | Submission requirements; linter `validate-manifest` |

**Discrepancies.** The template's `AGENTS.md` lists `author` as optional; the Manifest page marks it required. Follow the Manifest page. The TypeScript type `PluginManifest` marks `isDesktopOnly` optional and omits `fundingUrl`; the Manifest page and linter are the operative rule. The linter's `validate-manifest` rule also warns when the description contains "obsidian" or "plugin", which the docs do not forbid; the scanner disables that rule and "handles it separately". **Uncertain:** whether the legacy `helpUrl` key is still tolerated.

**Versions file (Mandatory for compatibility).** `versions.json` at the repository root maps each plugin version to its `minAppVersion`, for example `{"1.0.0": "1.13.0"}`. Obsidian consults it when a user's app is older than the current `minAppVersion`, to find the newest plugin version that still works. "You only need to update `versions.json` if you change the `minAppVersion`." The page's example contains a trailing comma; real JSON must not. Source: [Versions](https://docs.obsidian.md/Reference/Versions); [obsidian-releases README](https://github.com/obsidianmd/obsidian-releases/blob/master/README.md).

### 2.4 Repository and release requirements (Mandatory)

- Repository root must contain `README.md` (purpose and usage; an excerpt appears on the listing, and relative image links are rewritten), `LICENSE`, and `manifest.json`.
- `main.js` "must export a default class which extends `Plugin`" and "must bundle all external dependencies into this file". Source: [obsidian-api README](https://github.com/obsidianmd/obsidian-api/blob/9abd9605ce081383674aae1ed111c456edde0688/README.md).
- Each release is a GitHub release whose tag is exactly the manifest `version`. The docs say the tag "must match"; the template README and `AGENTS.md` say "don't include a prefix `v`". Treat a `v` prefix as a mismatch. Attach `main.js` and `manifest.json` as individual binary assets; `styles.css` too if the plugin has one. Do not zip them. Source: [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin); [template README](https://github.com/obsidianmd/obsidian-sample-plugin/blob/07ceb81d1fb3384af611ebf665a1ec42a7e5926d/README.md).
- Obsidian reads the repository's `manifest.json` at the head of the default branch to learn the latest version, then downloads `main.js`, `manifest.json` and `styles.css` from the release with the matching tag. Source: obsidian-releases README.
- Do not commit `main.js`; ship it only in releases. Commit a lock file. Source: template `.gitignore` and `AGENTS.md`; developer-docs self-critique checklist (`en/Obsidian October plugin self-critique checklist.md`, permalink `oo/plugin`).

### 2.5 Supported extension points

All names below are exported from the `obsidian` package and documented in `obsidian.d.ts` at the commit above. Guide pages are under docs.obsidian.md/Plugins.

| Area | API | Notes |
|---|---|---|
| Lifecycle | `Plugin.onload()`, `onunload()`, `onUserEnable()` (1.7.2), `onExternalSettingsChange()` (1.5.7) | `Plugin` extends `Component`; see section 4.2. |
| Cleanup | `register()`, `registerEvent()`, `registerDomEvent()`, `registerInterval()`, `addChild()` | Anything registered is released on unload. |
| Commands | `addCommand({id, name, callback \| checkCallback \| editorCallback \| editorCheckCallback, hotkeys?, mobileOnly?})`, `removeCommand()` (1.7.2) | Obsidian prefixes id and name with the plugin's. |
| Ribbon, status bar | `addRibbonIcon()`, `addStatusBarItem()` | Status bar items are "not available on mobile". |
| Settings | `addSettingTab(PluginSettingTab)`; declarative `getSettingDefinitions()` (1.13.0) with controls `toggle, text, textarea, number, slider, dropdown, file, folder, color, secret`; imperative `display()` with `Setting` | `display()` is tagged `@deprecated Since 1.13.0` in the types; see section 4.5. |
| Modals | `Modal`, `SuggestModal`, `FuzzySuggestModal`, `ConfirmationModal` (1.11), `AbstractInputSuggest` | |
| Views | `registerView(type, leaf => new MyView(leaf))`, `ItemView`, `TextFileView`, `registerExtensions()` | Deferred views since 1.7.2: `leaf.isDeferred`, `leaf.loadIfDeferred()`. |
| Workspace | `getLeaf()`, `getRightLeaf()`, `getLeavesOfType()`, `revealLeaf()`, `getActiveViewOfType()`, `activeEditor`, `onLayoutReady()` | `activeLeaf` is deprecated. |
| Editor | `registerEditorExtension(Extension)` (CodeMirror 6), `registerEditorSuggest()`, `Editor` | Reconfigure by mutating the same array and calling `workspace.updateOptions()`. |
| Rendering | `registerMarkdownPostProcessor()`, `registerMarkdownCodeBlockProcessor()`, `MarkdownRenderer.render()` | `renderMarkdown()` is deprecated. |
| Bases | `registerBasesView()` (1.10.0) | Returns false if Bases is disabled in the vault. |
| Files | `Vault.read/cachedRead/modify/process/create/copy/delete/trash`, `getFileByPath/getFolderByPath/getAbstractFileByPath` (1.5.7), `FileManager.processFrontMatter/renameFile/trashFile/getAvailablePathForAttachment`, `MetadataCache.getFileCache/getFirstLinkpathDest`, `normalizePath()` | See section 4.3. |
| Events | `vault.on('create'\|'modify'\|'delete'\|'rename')`, `metadataCache.on('changed'\|'resolved')`, `workspace.on('file-open'\|'file-menu'\|'editor-menu'\|…)` | Register with `registerEvent`. |
| Network | `requestUrl()` | "Without any CORS restrictions"; works on mobile. |
| Storage | `loadData()/saveData()` → `data.json`; `App.loadLocalStorage/saveLocalStorage` (1.8.7); `app.secretStorage` with `SecretComponent` (1.11.4) | See section 5.3. |
| Platform | `Platform.isDesktop/isMobile/isDesktopApp/isMobileApp/isIosApp/isAndroidApp/isPhone/isTablet/isMacOS/isWin/isLinux` | Use instead of `navigator` or `process.platform`. |
| Protocol and links | `registerObsidianProtocolHandler()`, `registerHoverLinkSource()` (1.1.0), `registerCliHandler()` (1.12.2) | |
| Helpers | `debounce`, `moment`, `parseYaml/stringifyYaml`, `getFrontMatterInfo`, `sanitizeHTMLToDom`, `htmlToMarkdown`, `setIcon/addIcon`, `prepareFuzzySearch`, `getLanguage`, `createEl/createDiv/createSpan/createFragment`, `activeWindow/activeDocument` | Import `moment` from `obsidian` rather than bundling a copy. |

Recent additions, by `@since` tag: 1.7.2 deferred views, `onUserEnable`, `removeCommand`; 1.8.7 `Vault.copy`, local storage helpers; 1.10.0 the Bases API; 1.11.0 and 1.11.4 `SettingGroup`, `SecretStorage`, `ConfirmationModal`; 1.12.2 the command-line interface handler; 1.13.0 declarative settings; 1.14.0 math rendering switched from MathJax to Temml. The API `CHANGELOG.md` stops at 1.7.2, so the `@since` tags in `obsidian.d.ts` are the only complete record of later additions. Source: `obsidian.d.ts` at `9abd960`; [obsidian.md/changelog](https://obsidian.md/changelog).

### 2.6 Plugin guidelines (Recommended, enforced selectively)

The guidelines page opens: "While the guidelines on this page are recommendations, depending on their severity, we may still require you to address any violations." The official linter turns several into errors. Source: [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines); linter `lib/index.ts` at `837b01d`.

| Guideline | Level | Linter rule |
|---|---|---|
| Use `this.app`, not the global `app` or `window.app` | Recommended | `no-restricted-globals` (warn) |
| Avoid unnecessary console logging; default console shows only errors | Recommended | `no-console` allows only `warn`, `error`, `debug` |
| Rename placeholder classes (`MyPlugin`, `SampleSettingTab`); remove sample code | Mandatory | `sample-names`, `no-sample-code` (error) |
| No Node or Electron on mobile; set `isDesktopOnly` or guard with `Platform` | Mandatory | `no-nodejs-modules` (warn, off when desktop-only) |
| No regular-expression lookbehind unless desktop-only (iOS below 16.4 lacks it) | Scanner error | `regex-lookbehind` |
| No top-level heading in settings; headings only with two or more sections; no "settings", "options", "general" or the plugin name in headings; sentence case for all UI text | Recommended | `settings-tab/no-problematic-settings-headings` (error), `ui/sentence-case` (warn) |
| Use `new Setting(el).setHeading()` rather than `<h1>`/`<h2>` | Recommended | `settings-tab/no-manual-html-headings` (error) |
| Avoid `innerHTML`, `outerHTML`, `insertAdjacentHTML`; use `createEl()` and `el.empty()` | Scanner error | `no-unsanitized/method`, `no-unsanitized/property`; `no-eval`, `no-implied-eval` |
| Never create and attach `<style>` or `<link>` elements; ship `styles.css` | Scanner error | `no-forbidden-elements` |
| No hard-coded inline styles; use CSS classes and Obsidian CSS variables | Recommended | `no-static-styles-assignment` (error) |
| Release every resource on unload | Recommended ("must") | — |
| Do not detach leaves in `onunload` | Recommended | `detach-leaves` (error, auto-fix) |
| Avoid default hotkeys | Recommended | `commands/no-default-hotkeys` (warn) |
| Use the right command callback (`callback`, `checkCallback`, `editorCallback`, `editorCheckCallback`) | Recommended | — |
| No "command" in command names or IDs; no plugin name in command names | Recommended | `commands/*` (warn) |
| Avoid `workspace.activeLeaf`; use `getActiveViewOfType()` or `activeEditor` | Recommended | `@typescript-eslint/no-deprecated` (warn) |
| Do not keep references to custom views; return a new instance from the factory and find views with `getLeavesOfType()` plus `instanceof` | Recommended | `no-view-references-in-plugin` (error) |
| Prefer the `Editor` API over `Vault.modify` for the active file; prefer `Vault.process` over `Vault.modify` for background edits; use `FileManager.processFrontMatter` for front matter; prefer the Vault API over the Adapter API; do not iterate all files to find one by path; use `normalizePath()` on user paths | Recommended | `vault/iterate` (warn) |
| Prefer `FileManager.trashFile()`; use `Vault.configDir`, never a hard-coded `.obsidian`; use `instanceof TFile` rather than casting | Recommended | `prefer-file-manager-trash-file`, `hardcoded-config-path`, `no-tfile-tfolder-cast` (warn) |
| Pass a real owning `Component` (the view, `this`) to `MarkdownRenderer.render`, never an orphaned `new Component()` | Recommended | `no-plugin-as-component` (error) |
| Prefer `const`/`let` over `var`; prefer `async`/`await` with `try`/`catch` over promise chains; avoid `as any` | Recommended | `@typescript-eslint/no-explicit-any` (warn) |
| Use `Platform` rather than `navigator` or `process.platform` | Recommended | `platform` (error) |
| Use `window.setTimeout` and `activeWindow`/`activeDocument` so pop-out windows work | Recommended | `prefer-window-timers`, `no-global-this` (warn) |

### 2.7 Platform compatibility

Desktop Obsidian is an Electron application with Node.js available. Mobile Obsidian is a Capacitor application for iOS and Android with no Node.js and no Electron. "Any calls to these libraries made by your plugin or it's dependencies can cause your plugin to crash." Source: [Mobile development](https://docs.obsidian.md/Plugins/Getting+started/Mobile+development).

- **Mandatory:** set `isDesktopOnly: true` if Node or Electron is used anywhere, including dependencies.
- **Recommended (official):** to support mobile while using Node on desktop, do not import Node modules at the top level; gate behind `Platform.isDesktopApp` and `require()` them at use time (section 9, excerpt E4). Do not cast `Vault.adapter` to `FileSystemAdapter`; check `instanceof`, since mobile uses `CapacitorAdapter`.
- **Mandatory:** regular-expression lookbehind fails on iOS below 16.4; the linter treats it as an error unless the plugin is desktop-only.
- Status bar items are not supported on mobile. `WorkspaceLeaf.parent` may be a `WorkspaceMobileDrawer`. Declarative settings render multiple controls per row stacked vertically on mobile.
- **Pop-out windows (desktop 0.15+):** use `activeWindow`, `activeDocument`, `el.win`, `el.doc` and `el.instanceOf()`. Source: [Support pop-out windows](https://docs.obsidian.md/Plugins/Guides/Support+pop-out+windows).
- **Right-to-left:** use CSS logical properties (`margin-inline-start`). Source: [Right-to-left](https://docs.obsidian.md/Plugins/User+interface/Right-to-left).
- Testing on mobile is covered in section 6.4.

### 2.8 Third-party code, external services and network access

- **Mandatory:** bundle every dependency into `main.js`; a plugin must not install or update itself or its dependencies. Keep `obsidian`, `electron`, all `@codemirror/*` and `@lezer/*` packages and Node built-ins as externals, because the app supplies them at run time. Bundling a second copy of CodeMirror breaks editor extensions. Source: obsidian-api README; template `esbuild.config.mjs`; community evidence in section 4.7.
- **Mandatory:** disclose network use, accounts, payment, outside-vault access and server-side telemetry in the README (section 2.1). Use `requestUrl` rather than `fetch`; the linter flags `fetch`, `axios`, `got`, `ky` and `node-fetch`.
- **Mandatory:** comply with dependency licences and attribute in the README where required. The template's `LICENSE` names "Dynalist Inc." and must be replaced; the linter's `validate-license` rule warns if it is not.
- **Recommended (official):** "Keep the plugin small. Avoid large dependencies. Prefer browser-compatible packages" (`AGENTS.md`). The linter's `depend/ban-dependencies` rule errors on micro-utility packages that native code can replace. **Uncertain:** no official list of approved or banned libraries exists beyond those presets. Community reports a 5 MB bundle-size limit in the scanner (section 4.8).
- Import `moment` from `obsidian`; use `getLanguage()` rather than reading `localStorage` for the language.

---

## 3. Development environment and project setup

### 3.1 Prerequisites

- Git, a Node.js environment and a code editor. Source: [Build a plugin](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin).
- Node version: the template README says "at least v18"; its lint workflow tests Node 20, 22 and 24; its release workflow uses Node 24. Node 18 and 20 are past end of life (April 2025 and April 2026). Use Node 22 or 24. Source: template at `07ceb81`; [endoflife.date/nodejs](https://endoflife.date/nodejs).
- npm is required by the template; commit `package-lock.json` and use `npm ci` in CI. Other bundlers are acceptable "if they bundle all external dependencies into `main.js`" (`AGENTS.md`).
- A separate, empty vault for development. "You should never develop plugins in your main vault." Source: Build a plugin.

### 3.2 Create the repository

1. On GitHub, open [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin) and choose "Use this template". Do not fork it. Clone the new repository. Source: template README; Submit your plugin ("If you created your plugin from one of our template repositories, you may skip" the publish step).
2. Read the template's [`AGENTS.md`](https://github.com/obsidianmd/obsidian-sample-plugin/blob/07ceb81d1fb3384af611ebf665a1ec42a7e5926d/AGENTS.md). It is the Obsidian team's brief for AI coding agents. Two of its statements are stale: the link to `validate-plugin-entry.yml` points at a deleted file, and it lists `author` as optional.
3. Edit, in this order: `manifest.json` (every key per section 2.3; remove or replace `fundingUrl`), `package.json` (`name`, `version` equal to the manifest, `description`, `license`), `versions.json`, `README.md`, `LICENSE` (your own name and year), then replace `src/main.ts` and `src/settings.ts` sample code. Rename the plugin folder in the vault to the `id`.

What the template contains at `07ceb81`: `src/main.ts`, `src/settings.ts`, `manifest.json`, `versions.json`, `styles.css` (empty), `esbuild.config.mjs`, `eslint.config.mts`, `tsconfig.json`, `version-bump.mjs`, `.npmrc` (`tag-version-prefix=""`), `.editorconfig` (tabs, width 4, single quotes), `.github/workflows/lint.yml`, `.github/workflows/release.yml`, `AGENTS.md`, `LICENSE` (0BSD), `README.md`.

### 3.3 Scripts and build configuration

| Script | What it does |
|---|---|
| `npm run dev` | esbuild in watch mode; inline source maps; not minified; writes `main.js` to the repository root. |
| `npm run build` | `tsc -noEmit -skipLibCheck` (type-check only) then a minified esbuild production build without source maps. |
| `npm run lint` | `eslint .` with the official linter. |
| `npm version patch\|minor\|major` | Bumps `package.json`, runs `version-bump.mjs` (writes `manifest.json` version and adds a `versions.json` entry if absent), commits, and tags with no `v` prefix. See section 8.1. |

esbuild settings: entry `src/main.ts`, `bundle: true`, `format: 'cjs'`, `target: 'es2021'`, externals as in section 2.8, `treeShaking: true`, `outfile: 'main.js'`. TypeScript: `strict: true`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `isolatedModules`, `lib: ["ES2021", "DOM"]`. Dev dependencies pinned by the template: `esbuild` 0.25.5 exact, `typescript ^5.8.3`, `eslint ^9.39.4`, `typescript-eslint ^8.59.1`, `eslint-plugin-obsidianmd ^0.4.0`, `jiti ^2.6.1`, `obsidian "latest"`. Pin `obsidian` to an exact version for reproducible builds and let a dependency bot propose bumps (section 8.3). Keep TypeScript on 5.x: typescript-eslint supports TypeScript below 6.1 and npm `typescript@latest` is 7.0.2. Source: template files at `07ceb81`; [typescript-eslint dependency versions](https://typescript-eslint.io/users/dependency-versions/).

### 3.4 Connect the plugin to a development vault

The plugin must live at `<vault>/.obsidian/plugins/<id>/` with `main.js`, `manifest.json` and `styles.css` at the top of that folder. Three ways to get there:

- Clone the repository directly into that folder (what the docs describe).
- Keep the repository elsewhere and create a directory symlink at `<vault>/.obsidian/plugins/<id>` pointing to the repository. The Hot Reload plugin supports directory symlinks but not file symlinks. Source: [hot-reload README](https://github.com/pjeby/hot-reload/blob/4c5454963ec4cbe847302d3063ada4b4204d7e95/README.md).
- Have the build copy output into the vault, as the official importer plugin's esbuild config does (section 9.2).

Enable the plugin: Settings → Community plugins → Turn on community plugins → toggle the plugin. After source changes, toggle the plugin off and on or run the command "Reload app without saving". After manifest changes, restart Obsidian. Source: Build a plugin; [Development workflow](https://docs.obsidian.md/Plugins/Getting+started/Development+workflow).

### 3.5 Faster reload and the developer console

- **Hot Reload (Community, recommended by the official docs).** The `pjeby/hot-reload` plugin (0.3.1, ISC licence) watches `main.js` and `styles.css` in any plugin folder containing a `.git` directory or a `.hotreload` file, and disables then re-enables the plugin about 0.75 seconds after changes stop. It can enable disabled plugins, so use it only in a development vault. Your plugin must clean up in `onunload`, or repeated reloads destabilise the app. Mobile support is "experimental". Source: hot-reload README at `4c54549`; Development workflow page.
- **Obsidian command-line interface (official, 1.12 installer or later).** With the app running, `obsidian plugin:reload id=<id>`, `obsidian eval`, `obsidian dev:errors`, `obsidian dev:console`, `obsidian dev:screenshot` and `obsidian dev:mobile` are available on Windows, macOS and Linux, and are described as letting "agentic coding tools test and debug automatically". The official importer's build script calls `plugin:reload` after each build. Source: [Obsidian CLI help](https://obsidian.md/help/cli); importer `esbuild.config.mjs` at `9e574b8`.
- **Developer console:** Ctrl+Shift+I on Windows and Linux, Cmd+Option+I on macOS, then the Console tab. If output does not appear, use View → Toggle Developer Tools; the shortcut may target another window. Source: [Anatomy of a plugin](https://docs.obsidian.md/Plugins/Getting+started/Anatomy+of+a+plugin); forum thread 80836.
- **Mobile emulation on desktop:** in the console run `this.app.emulateMobile(true)`; `false` turns it off. **Uncertain:** `emulateMobile` is documented on the Mobile development page but absent from `obsidian.d.ts`; in plugin code use `Platform` flags instead.

### 3.6 Recommended repository layout (Community and `AGENTS.md`)

Keep `src/main.ts` small and focused on lifecycle; split features into folders such as `src/commands`, `src/ui`, `src/settings`, `src/utils`. Every actively maintained plugin surveyed uses a multi-folder `src/`. The heaviest-tested plugins separate pure logic, which never imports `obsidian`, from adapter code that does, and some enforce that boundary with a lint or script (TaskNotes `scripts/run-architecture-conformance.mjs`). This makes unit testing possible without a running Obsidian (section 6.2). Name test and build folders to match the scanner's ignore list (`tests/`, `__mocks__/`, `scripts/`, `docs/`, `test-vault/`, `e2e-tests/`) so they are excluded from review (section 7.4). Source: `AGENTS.md`; Plugin guidelines "Consider organizing your code base using folders"; Boninall, ["Refactor Week of 2025"](https://boninall.com/blog/refactoring-plugins) (3 March 2025); [Hub testing guide](https://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/Guides/How+to+add+automated+tests+to+your+plugin).

---

## 4. Architecture and implementation practices

Official sources say little about architecture beyond "organise code in folders". This section combines the official API guidance with practice observed in thirteen established plugins (section 9 lists them with commits). Counts such as "12 of 13 repositories" come from a read-only grep of each repository's `src/` folder on 10 October 2026, excluding tests.

### 4.1 Design principles

- **Separate pure logic from Obsidian adapters (Community, widely supported).** Business rules live in modules that do not import `obsidian`; a thin adapter layer handles events, the metadata cache, file writes, commands and settings. Tasks keeps Obsidian-touching code in `src/Obsidian/` and tests the rest against a near-empty `App` mock; TaskNotes enforces three tiers with a conformance script. Moritz Jung (maintainer of Meta Bind) frames dependency injection and interfaces as the alternative to mocking. Source: Tasks `tests/__mocks__/obsidian.ts` at `84704d3`; TaskNotes `scripts/run-architecture-conformance.mjs` at `69535cd`; [Moritz Jung, "Challenges when testing plugins"](https://www.moritzjung.dev/obsidian-collection/plugin-dev/testing/challengeswhentestingplugins/).
- **Pass `app` and `plugin` explicitly (official and community).** No surveyed plugin uses `window.app`. Services and views receive `plugin` or `app` in their constructors. Source: Plugin guidelines; grep of 13 repositories.
- **UI framework or plain DOM (Community, contested).** Svelte is used by Tasks, obsidian-git, QuickAdd, Omnisearch; Preact or React by Dataview, Kanban, Excalidraw; plain `createEl` helpers by Templater, the official importer, TaskNotes and Style Settings. The forum has no consensus ("Different developers will have different approaches", 2021). The official linter prefers `createEl` (`prefer-create-el`, warn) and reviewers expect a native look. Excalidraw compresses its React runtime to stay under the scanner's reported 5 MB bundle limit. A common compromise: native `Setting`, `Modal` and settings tabs, with a framework only inside custom views. Mount in `onOpen` and unmount in `onClose` (section 9, excerpt E11). Source: forum thread 20867; Excalidraw `rollup.config.mjs` lines 140–190 at `f30b4c5`; [Use React](https://docs.obsidian.md/Plugins/Getting+started/Use+React+in+your+plugin), [Use Svelte](https://docs.obsidian.md/Plugins/Getting+started/Use+Svelte+in+your+plugin).

### 4.2 Lifecycle

- **`onload` does only what is needed to initialise (Recommended, official).** "It should not include anything computationally expensive or data fetching." Register commands, views, settings tab and ribbon icon here. Put vault scans, indexing and network calls in `this.app.workspace.onLayoutReady(() => …)`, which runs after Obsidian finishes loading. Register `vault.on('create')` inside `onLayoutReady`, because Obsidian fires `create` for every file at startup. Keep custom view constructors cheap, since saved views are rebuilt at launch. Measure with the stopwatch under Settings → General → Advanced. Source: [Optimize plugin load time](https://docs.obsidian.md/Plugins/Guides/Optimize+plugin+load+time).
- **Register views in `onload`, not in `onLayoutReady` (Community).** A forum bug report states that calling `registerView` late "replaces existing views of that type with an EmptyView". Source: forum thread 112337.
- **Use the `register*` helpers so unload is automatic (Mandatory wording: resources "must be destroyed or released").** `registerEvent` for `vault`, `metadataCache` and `workspace` events; `registerDomEvent` for DOM listeners on long-lived elements; `registerInterval(window.setInterval(…))`; `register(() => …)` for anything else, such as `worker.terminate()`; `addChild(component)` for sub-components with their own lifecycle. Observed `onunload` bodies in well-maintained plugins are a few lines. Source: Plugin guidelines; [Manage plugin lifecycle](https://docs.obsidian.md/Plugins/Guides/Manage+plugin+lifecycle); Dataview `import-manager.ts` line 38 at `5ad0994`.
- **Do not detach your leaves in `onunload` (Recommended, linter error).** Obsidian re-creates them in place on update. Older plugins did the opposite, and that pattern is now flagged. Source: Plugin guidelines; linter `detach-leaves`.
- **Do not store view instances on the plugin (linter error).** Return `new MyView(leaf)` from the factory and find views with `getLeavesOfType()` plus `instanceof`. Source: [Views](https://docs.obsidian.md/Plugins/User+interface/Views); linter `no-view-references-in-plugin`.
- **`onUserEnable()` (1.7.2)** runs when the user explicitly enables the plugin, which is the right place to open a custom view for the first time. **`onExternalSettingsChange()`** fires when `data.json` changes on disk, for example through Obsidian Sync; reload settings there. Source: `obsidian.d.ts`.
- **Make load and unload idempotent (Community and `AGENTS.md`).** Hot Reload disables and re-enables the plugin on every build; leaked listeners or globals surface immediately. Omnisearch deletes its global in `onunload`. Source: hot-reload README; Omnisearch `src/main.ts` at `0a4e93b`.

### 4.3 Files, folders and front matter

| Need | Use | Why |
|---|---|---|
| Read for display or indexing | `vault.cachedRead(file)` | Served from cache; cheaper. Official Vault page. |
| Read the latest bytes before editing | `vault.read(file)` | Bypasses cache. |
| Edit a file the user may have open | the `Editor` API via `getActiveViewOfType(MarkdownView)` | Preserves cursor, selection and folds. Plugin guidelines. |
| Edit a file in the background | `vault.process(file, data => newData)` | Atomic read-modify-write. "Always prefer `Vault.process()` over `Vault.read()`/`Vault.modify()` to avoid unintentional loss of data." The callback must be synchronous. A July 2026 bug report showed overlapping `modify` calls leaving a file stuck in a saving state so that the next autosave overwrote an external edit silently; Obsidian's developer Licat replied a fix was coming. Adoption in older code is thin (one call each in Templater, QuickAdd, importer, TaskNotes), so this is endorsed more than practised. Source: [Vault](https://docs.obsidian.md/Plugins/Vault); forum thread 116346 (dtkav, 22 July 2026). |
| Edit front matter | `fileManager.processFrontMatter(file, fm => { fm.key = value }, writeOptions?)` | Atomic; no hand-written YAML; optional `ctime`/`mtime` preservation (excerpt E6). Known caveat: it is asynchronous and can race with other writers such as Templater. Source: Plugin guidelines; forum threads 80301, 78628. |
| Rename or move | `fileManager.renameFile(file, newPath)` | Updates links in other notes. Used in Excalidraw, TaskNotes, Templater, QuickAdd; bare `vault.rename` is rare. |
| Delete | `fileManager.trashFile(file)` | Respects the user's trash preference. Linter `prefer-file-manager-trash-file`. |
| Find by path | `vault.getFileByPath()`, `getFolderByPath()`, `getAbstractFileByPath()` | Never iterate all files to find one. Linter `vault/iterate`. |
| Narrow a file object | `if (file instanceof TFile)` | Never cast. Linter `no-tfile-tfolder-cast`. |
| Build or accept a path | `normalizePath(path)` | Cross-platform separators and trimming. Plugin guidelines. |
| Create a folder | check `getAbstractFileByPath` first; `createFolder()` throws if a folder differs only by case | Excerpt E5 from the official importer. |
| The configuration folder | `this.app.vault.configDir` | Usually `.obsidian`, but users can change it. Linter `hardcoded-config-path`. |
| Files outside the vault index (for example under `.obsidian/`) | `vault.adapter.read/write` | Only for such files; prefer the Vault API otherwise because it caches and serialises. Source: Plugin guidelines; forum thread 113621 (dimagious, 24 September 2026). |
| Attachments | `fileManager.getAvailablePathForAttachment()` | Honours the user's attachment folder setting. |

**Serialise writes to one file (Community, widely supported).** Even with `process`, concurrent callers racing on the same file is a design error. obsidian-git uses a single-flight promise queue; TaskNotes keeps a per-file `WeakMap<TFile, Promise>` queue; Templater saves the active editor before `process` when the file is open. Source: obsidian-git `src/promiseQueue.ts` at `ee068b6`; TaskNotes `src/core/VaultMutationService.ts` lines 17–80 at `69535cd`; Templater `src/core/Templater.ts` line 369 at `c51cf11`.

### 4.4 Metadata cache, events and indexes

- **Read metadata from the cache, not from file contents.** `metadataCache.getFileCache(file)` gives front matter, headings, links, tags and embeds. `getFirstLinkpathDest(linktext, sourcePath)` resolves a link. Source: [Vault](https://docs.obsidian.md/Plugins/Vault) and TypeScript reference.
- **Wait for the first `resolved` event before a full load, then react to `changed` (Community, widely supported).** `metadataCache.on('resolved')` fires on every change, so guard the initial load with a flag; `metadataCache.on('changed', file)` fires per file after startup and is the right trigger to re-index one file (excerpt E12). Source: Tasks `src/Obsidian/Cache.ts` lines 146–167 at `84704d3`.
- **Handle `rename` and `delete` explicitly in any index, and key the index by path.** `TFile` objects are mutated on rename, so do not store them long-term. Omnisearch removes the old path and adds the new one on `rename`; Tasks rewrites task paths. Source: Omnisearch `src/main.ts` lines 117–165 at `0a4e93b`; Tasks `Cache.ts` lines 172–229.
- **Debounce bursty work.** `debounce()` from `obsidian` appears in 12 of 13 repositories. Omnisearch flags a note for re-indexing on `modify` rather than re-indexing synchronously. Source: grep; Omnisearch `src/main.ts` line 146.
- **Wrap event handlers in `try`/`catch`** so one bad file does not break the handler for all files; keep the last good state on a failed read. Source: Omnisearch `src/main.ts` lines 120–131; Tasks `Cache.ts` line 314.

### 4.5 Settings

- **Load with defaults using the three-argument form:** `Object.assign({}, DEFAULT_SETTINGS, await this.loadData())` (excerpt E2). The two-argument form mutates the defaults object and is flagged by the linter's `object-assign` rule, even though the official Settings page still shows it. Handle `loadData()` returning `null` on first run. Source: template `src/main.ts` lines 91–97; [Settings](https://docs.obsidian.md/Plugins/User+interface/Settings).
- **Declarative settings (Obsidian 1.13.0) are the target; keep `display()` when `minAppVersion` is below 1.13.0.** `getSettingDefinitions()` returns an array of definitions with controls (`toggle`, `text`, `number`, `dropdown`, `folder`, `secret` and others), `validate` callbacks that return an error string, `visible` and `disabled` predicates, groups and pages. Obsidian reads, writes and saves values itself and indexes them for search. Keep the function cheap: no I/O, no network. Call `this.update()` rather than `display()` to refresh. The types mark `display()` `@deprecated Since 1.13.0`, while the Settings page says the imperative API "remains supported indefinitely as a fallback on 1.13+" (**Uncertain** which wording governs; both agree new code should be declarative). Seven of the surveyed plugins already use definitions; Tasks and TaskNotes support both behind `requireApiVersion('1.13.0')`. The linter's `settings-tab/*` rules require `display()` below 1.13.0 and prefer definitions at or above it. Source: [Settings](https://docs.obsidian.md/Plugins/User+interface/Settings); [Migrate to declarative settings](https://docs.obsidian.md/Plugins/Guides/Migrate+to+declarative+settings); `obsidian.d.ts` lines 9289–9303; excerpt E9.
- **Headings and wording.** No top-level heading; headings only with two or more sections; no "settings" in a heading; sentence case; one control per row; save on change, not on a submit button; short descriptions; avoid text areas in the main tab. Source: Plugin guidelines; Settings page.
- **Migrations (Community, widely supported).** No surveyed plugin uses a single numeric schema version. The dominant pattern is named, idempotent migrations recorded as flags in the saved data, run once at load, with a backup restored on error and support for "not complete yet, retry later" (excerpt E16). Templater uses a `data_version` field with a type guard and tells the user which security-sensitive settings were reset. Never rewrite a corrupt settings file with an empty object; QuickAdd and TaskNotes detect a half-written `data.json` from a sync client and refuse to overwrite it. Source: QuickAdd `src/migrations/` at `2201fa7`; Templater `src/settings/migrate-settings.ts` at `c51cf11`; TaskNotes `src/main.ts` lines 690–696.
- **Saving.** Save on each change, or debounce text input and flush in `onunload`. Await `saveData()` so a rejection is attributable. Source: TaskNotes `TaskNotesSettingTab.ts` lines 25–72; QuickAdd `src/main.ts` lines 97–105.

### 4.6 Views, workspace, modals and commands

- **Custom views.** Subclass `ItemView` (or `TextFileView` to replace the editor for certain files). Register with `registerView(TYPE, leaf => new MyView(leaf))` in `onload`. To open or reveal: look for `getLeavesOfType(TYPE)`; if none, take `getRightLeaf(false) ?? getLeaf()` and `await leaf.setViewState({type: TYPE, active: true})`; then `await this.app.workspace.revealLeaf(leaf)` (excerpt E10). Persist view state with `getState()`/`setState()`. Clean up in `onClose`: unmount frameworks, disconnect observers, clear timers and `offref` any `EventRef` not registered through the view's own `register*`. Source: [Views](https://docs.obsidian.md/Plugins/User+interface/Views); obsidian-git and TaskNotes views in section 9.
- **Deferred views (1.7.2 and later).** At startup every view is a placeholder `DeferredView` until its tab is shown. Always `instanceof`-check `leaf.view` before use. Reveal a leaf before talking to its view. Call `leaf.loadIfDeferred()` only when you must touch a hidden view, inside a `requireApiVersion('1.7.2')` guard, because it removes the optimisation (excerpt E14). Skip refresh work for leaves where `leaf.isDeferred` is true. Source: [Defer views](https://docs.obsidian.md/Plugins/Guides/Defer+views); obsidian-git `src/main.ts` lines 149–160.
- **Active view.** `getActiveViewOfType(MarkdownView)` with a null check, or `workspace.activeEditor`; never `workspace.activeLeaf`.
- **Modals.** `Modal` for custom content (build in `onOpen`, `contentEl.empty()` in `onClose`); `SuggestModal` and `FuzzySuggestModal` for pickers; `AbstractInputSuggest` for auto-complete on a text field (the linter prefers it over the copied `TextInputSuggest` class found in older plugins). A promise-returning wrapper (`static Prompt(app, …): Promise<string>`) is the common community pattern. Source: [Modals](https://docs.obsidian.md/Plugins/User+interface/Modals); QuickAdd `src/gui/GenericInputPrompt/` at `2201fa7`.
- **Commands.** `callback` when the command always runs; `checkCallback(checking)` when it is conditional (return `true` when available, do the work only when `checking` is false); `editorCallback`/`editorCheckCallback` when a Markdown editor is required (excerpt E1). No default hotkeys. Stable IDs: never rename a command ID after release. Source: [Commands](https://docs.obsidian.md/Plugins/User+interface/Commands); `AGENTS.md`.
- **Ribbon.** Users can hide ribbon icons, so every ribbon action should also be a command. Plugins do not add their own toggle for ribbon items. Source: [Ribbon actions](https://docs.obsidian.md/Plugins/User+interface/Ribbon+actions).
- **Icons.** Lucide icon names up to Lucide 0.446.0; custom icons via `addIcon()` in a 0 0 100 100 view box. Source: [Icons](https://docs.obsidian.md/Plugins/User+interface/Icons).

### 4.7 Editor and rendering

- **CodeMirror 6 extensions** via `registerEditorExtension()`: `ViewPlugin`, `StateField`, decorations and keymaps (`Prec.highest(keymap.of(...))`). Keep `@codemirror/*` and `@lezer/*` external so the plugin uses the app's instances; several plugins pin `@codemirror/language` to Obsidian's fork `github:lishid/cm-language` for type compatibility. To change extensions later, mutate the registered array and call `workspace.updateOptions()`. The raw `EditorView` is reachable only through the untyped `view.editor.cm`. Source: [Editor extensions](https://docs.obsidian.md/Plugins/Editor/Editor+extensions) and sibling pages; Tasks `LivePreviewExtension.ts` at `84704d3`; Advanced Tables `src/main.ts` lines 272–298 at `1a22239`.
- **Markdown post-processors and code blocks.** `registerMarkdownCodeBlockProcessor('lang', (source, el, ctx) => …)`; for anything with its own lifecycle, create a `MarkdownRenderChild`, call `ctx.addChild(child)`, and build the DOM in its `onload`. Use `sortOrder` for priority. Render Markdown with `MarkdownRenderer.render(app, md, el, sourcePath, ownerComponent)`. Source: [Markdown post processing](https://docs.obsidian.md/Plugins/Editor/Markdown+post+processing); Tasks `QueryRenderer.ts` lines 45–73.

### 4.8 Performance and mobile

- Light `onload`; defer to `onLayoutReady`; lazy `import()` for heavy or desktop-only parts (Omnisearch loads its HTTP server this way). TfTHacker's 2022 call to optimise startup remains the community reference; Zsolt Viczián reported an 11 to 6 second vault load after bundle changes. Source: forum thread 32321; Omnisearch `src/main.ts` lines 63–73.
- Incremental, path-keyed indexes; metadata cache over file reads; `getMarkdownFiles()` only for genuine full scans.
- **Web Workers are possible but must be inlined into `main.js`.** Dataview spawns a worker pool with a Rollup worker-loader plugin and ties termination to a `Component` (excerpt E15). An Obsidian maintainer confirmed in a review that a worker needs "a esbuild plugin that can bundle it inside of the main.js". Omnisearch does not use a worker. Source: Dataview at `5ad0994`; obsidian-releases PR 1805 (via search summary; the PR itself is no longer retrievable).
- **Bundle size.** No official limit is documented. Excalidraw's build comments cite a 5 MB scanner limit; TaskNotes fails CI over a budget tied to Obsidian Sync limits (**Community**). Ship minified production builds. Source: Excalidraw `rollup.config.mjs` lines 152–161; TaskNotes `.github/workflows/test.yml` lines 29–36.
- **Mobile.** Branch on `Platform.*` (TaskNotes 21 checks, importer 20, obsidian-git 17); disable heavy features; avoid large in-memory structures. obsidian-git picks a Node-based Git on desktop and a pure-JavaScript Git on mobile. Source: obsidian-git `src/main.ts` lines 549–576.

### 4.9 Asynchronous code, errors and logging

- `new Notice(message)` for anything the user must see; `console.error`/`console.warn` for diagnostics; `console.debug` for development output (visible only at the Verbose level). Production `console.log` is flagged by the linter.
- No floating promises: `await`, or `void promise.catch(…)` with a reason. typescript-eslint's `no-floating-promises` is part of the recommended type-checked set the linter enables.
- `async`/`await` with `try`/`catch`; handlers must not throw.
- Dev builds: inline source maps; production: none, minified. Every surveyed esbuild config does this.
- Source: Plugin guidelines; linter configuration; QuickAdd `src/main.ts` lines 100–105; Tasks `QuickSearchTasksModal.ts` line 134.

### 4.10 Internal APIs and patching core behaviour (Community, risky)

Undocumented APIs (`app.plugins`, `app.internalPlugins`, `app.commands`) are typed by the community package `obsidian-typings` (6.41.0, MIT), whose README warns the typings are "based on reverse engineering and may be inaccurate or unstable… Always test thoroughly and add fallbacks". Established plugins feature-detect with optional chaining and keep a fallback (TaskNotes `src/bases/api.ts` lines 53–80). Patching core methods with `monkey-around` (Excalidraw, Kanban, TaskNotes) is accepted practice when each patch is wrapped in `this.register(around(...))` and de-duplicated, but the official docs never mention it and the scanner's reaction is unknown. Avoid both in a plugin meant for the directory unless no public API exists. Source: [obsidian-typings README](https://github.com/Fevol/obsidian-typings/blob/fe6eb020d6fe4359d43e69028d04aee50fa7017b/README.md); [monkey-around README](https://github.com/pjeby/monkey-around); Excalidraw `src/core/managers/MonkeyPatchManager.ts` at `f30b4c5`.

### 4.11 Styling

- All CSS in `styles.css` at the plugin root; Obsidian loads it automatically. Never create `<style>` elements (scanner error) or set `el.style.*` in code (linter error). Toggle classes with `toggleClass`. Source: [HTML elements](https://docs.obsidian.md/Plugins/User+interface/HTML+elements); Plugin guidelines.
- Use Obsidian's CSS variables (`--background-modifier-border`, `--text-muted`, `--size-4-*`) so themes and snippets can restyle the plugin; define your own `--` variables when none fits. TaskNotes uses `var(--…)` over four thousand times and almost no hex colours. Source: Plugin guidelines; grep.
- Prefix class names with the plugin name (`importer-`, `tasknotes-`, `qa-`) to avoid collisions. **Community.**
- **Uncertain:** no official text on `!important` was found, but 2026 scanner reports list "Avoid `!important`" and "Avoid `:has`" as warnings (section 7.5).

---

## 5. Security, privacy and data integrity

### 5.1 What the policies require

Section 2.1 lists the policy text. In practice a plugin must: run offline by default; disclose every network destination and why in the README; never collect usage data inside the app; never fetch and execute remote code or update itself; stay inside the vault unless the README explains otherwise; ship readable, unobfuscated code; include and honour licences. The template's `AGENTS.md` adds: "Never execute remote code, fetch and eval scripts, or auto-update plugin code" and require "explicit opt-in" for analytics or third-party services. Obsidian's May 2026 blog says capability disclosures (network, file system, clipboard) are planned for listings. Source: Developer policies; `AGENTS.md`; blog.

### 5.2 Safe DOM and code execution (Scanner errors)

- Never assign `innerHTML`, `outerHTML` or call `insertAdjacentHTML` with anything derived from user content or the network. Build with `createEl()`, `createDiv()`, `setText()`; clear with `el.empty()`. If HTML is unavoidable, pass it through `sanitizeHTMLToDom()`. Render Markdown with `MarkdownRenderer.render()`. Remaining `innerHTML` uses in surveyed code are clears (`= ""`, which should be `.empty()`), reads, or vendored libraries.
- Never use `eval`, `new Function` or implied eval (string arguments to `setTimeout`). A reviewer accepted one documented exception for compiling user-authored views; expect to justify any such case in writing.
- Never create `<style>` or `<link>` elements; use `styles.css`.
- These three families are the only rules the scanner keeps at error level besides regex lookbehind. Source: linter `docs/configuration.md`; the cases in section 7.5.

### 5.3 Secrets

`data.json` is plain text and travels with the vault through every sync tool; a 2023 forum report describes an API key revoked after a vault was pushed to a public Git repository. Since Obsidian 1.11.4, store tokens with `this.app.secretStorage.setSecret(id, value)` and render the field with `SecretComponent`, keeping only the secret's id in settings. Provide a fallback when `secretStorage` is absent (older app), and migrate existing plaintext keys once, as BRAT, QuickAdd and TaskNotes do. **Uncertain:** a 29 August 2026 forum report says secrets appear vault-scoped on desktop but device-shared on mobile; secrets are not synced between devices. Source: [Store secrets](https://docs.obsidian.md/Plugins/Guides/Store+secrets); forum threads 56035 and 117793; BRAT `src/ui/SettingsTab.ts` lines 756–800 at `e9484d8`; QuickAdd `src/migrations/migrateProviderApiKeysToSecretStorage.ts`.

### 5.4 Protecting the user's notes

- Use `vault.process` and `processFrontMatter` for edits; serialise writes per file (section 4.3).
- Preserve file timestamps when rewriting imported or converted content by passing `DataWriteOptions` (excerpt E6).
- Expect files to change underneath you: sync tools, Git and other plugins edit the same files. Implement `onExternalSettingsChange`; re-read before writing; tolerate half-written `data.json` rather than overwriting it; never silently reset settings, and tell the user when a migration resets anything (Templater shows a `Notice`).
- Delete through `fileManager.trashFile()` so the user's trash preference is honoured.
- "Leave no trace": do not write plugin-specific configuration into users' notes unless that is the feature. Source: Boninall (2025).
- Keep Hot Reload and BRAT out of users' vaults; both are development tools that can enable or install code.
- Source: Plugin guidelines; `AGENTS.md`; QuickAdd `src/main.ts` lines 380–395 and 480–488; Templater `src/main.ts` lines 71–89.

### 5.5 Network

Use `requestUrl()`; pass `throw: false` to inspect status codes yourself, handle 429 with the `retry-after` header, and surface failures with a `Notice` (excerpt E7). Disclose every remote service in the README. No community convention for retry and back-off was found (**Uncertain**). Source: `obsidian.d.ts` lines 7841–7890; importer `src/formats/airtable-api/api-helpers.ts` lines 51–100 at `9e574b8`.

### 5.6 Dependencies

Every production dependency ships inside `main.js`, so its licence ships with the plugin and its vulnerabilities become yours. The scanner reports known vulnerable dependencies (a 2026 case flagged a `js-yaml` advisory) and attempts to detect obfuscation, with at least one false positive on bundled Prettier that a reviewer unlocked. Run `npm audit`, keep dependencies few, record third-party licences in the README or a notices file, and prefer browser-compatible packages. Source: the WeWrite and Format with Prettier cases in section 7.5; Developer policies; `AGENTS.md`.

---

## 6. Testing and quality assurance

### 6.1 What is official and what is not

The official documentation contains no guidance on automated testing. A search of every page in the docs repository for "unit test", "jest", "vitest" and "mocha" found nothing. The official workflow is manual: a separate development vault, `npm run dev`, reload, the developer console, mobile emulation, device inspection, BRAT for beta testers, and the directory's "Review branch" preview scan. The only official acknowledgement of tests is indirect: the scanner ignores `*.test.*`, `*.spec.*`, `test/`, `tests/`, `__tests__/`, `mocks/`, `__mocks__/`, `test-vault/` and `e2e-tests/`. Everything else in this section is community practice, and the community disagrees about how much to test: TaskNotes has 946 test files, QuickAdd 603 plus real-app tests, Tasks 178, the official importer 136; Excalidraw, Kanban, Metadata Menu and Periodic Notes have none. Source: developer-docs grep at `c56c7e7`; linter `docs/configuration.md`; repository survey.

### 6.2 Unit tests for pure logic

The `obsidian` npm package contains only type definitions (`"main": ""`), so any import of it throws outside the app. Unit tests therefore either test modules that never import `obsidian`, or alias the module to a hand-written shim:

- Vitest `resolve.alias.obsidian` → `tests/__mocks__/obsidian.ts` (Tasks, excerpt E13; obsidian-git; QuickAdd).
- Jest `moduleNameMapper` `'^obsidian$'` → a mock file (TaskNotes, Dataview).
- TypeScript `paths` in a test tsconfig (official importer, excerpt E8, run with Node's built-in test runner).

Shims are minimal: empty classes for `Plugin`, `Notice`, `TFile`, `TFolder`, a `Platform` object, `normalizePath`, `moment`. The published package `obsidian-test-mocks` (mnaoumov, MIT, 7.2.0) offers in-memory implementations instead; TaskNotes uses it. `jest-environment-obsidian` is archived (last push April 2023) and should not be used. Moritz Jung's caution applies to every mock: tests "only reflect your assumptions about the API", so keep business logic Obsidian-free where possible and verify the real integration in the app. Vitest is the most common runner among active repositories; Jest is legacy; the importer uses `node:test`. Source: npm `obsidian@1.14.4` metadata; repositories in section 9; [Moritz Jung, testing notes](https://www.moritzjung.dev/obsidian-collection/plugin-dev/testing/frameworksandutilities/).

### 6.3 Tests inside a real Obsidian

Three live approaches exist. None is official, and none runs on iOS.

| Approach | What it does | Status (10 October 2026) |
|---|---|---|
| [wdio-obsidian-service](https://github.com/jesse-r-s-hines/wdio-obsidian-service) (WebdriverIO, MIT, 3.3.0) | Downloads and caches Obsidian versions; sandboxes a vault; `browserVersion` may be an exact version, `latest`, `latest-beta` (Insiders account needed) or `earliest`, meaning your `minAppVersion`; helpers `executeObsidianCommand`, `executeObsidian`, `reloadObsidian`, `resetVault`; Windows, macOS, Linux; mobile via `emulateMobile` or a real Android emulator through Appium. "Testing on iOS is currently not supported." Needs WebdriverIO 9.x, Mocha, and on Linux CI an X virtual framebuffer. | Active; single maintainer; adopted by Templater (local runs only, no CI step found). The author's `wdio-obsidian-service-sample-plugin` (0BSD) is the suggested starting template. |
| Obsidian command-line interface (official, 1.12.7 or later) | `plugin:reload`, `eval`, `dev:errors`, `dev:console`, `dev:screenshot`, `dev:mobile` against a running app. QuickAdd's `obsidian-e2e` package and Excalidraw's smoke-test runner are built on it. | Official tool; test harnesses built on it are community projects. "Obsidian CLI requires the Obsidian app to be running", so tests cannot run while you use the same app. |
| Playwright against the Electron binary | Drives the app's own window; asserts through `window.app` rather than fragile CSS classes. TaskNotes unpacks an AppImage in `e2e-setup.sh`. | Bespoke per project. |

Source: wdio-obsidian-service README at `f4844f4`; [Obsidian CLI help](https://obsidian.md/help/cli); QuickAdd `tests/e2e/` at `2201fa7`; forum threads 98645, 107493, 116864.

### 6.4 Manual testing and mobile

- Keep a committed development vault with fixture notes covering the plugin's input formats (Tasks `resources/sample_vaults/Tasks-Demo`, Templater `test/vault`, TaskNotes `tasknotes-e2e-vault`). Keep user data out of it.
- Test desktop, then `this.app.emulateMobile(true)` in the console (the layout changes; Node remains available, so this does not prove mobile safety).
- Real devices: Android via USB debugging and `chrome://inspect/` in a Chromium browser; iOS 16.4 or later via Safari Web Inspector on a Mac. The official pages do not say how to copy a development build to a phone. Community routes: Obsidian Sync with "Installed community plugins" enabled restarts changed plugins; iCloud Drive vaults on iOS; `adb push` into `.obsidian/plugins/<id>/` on Android. In-app consoles exist as community plugins (vConsole, Logstravaganza, Advanced Debug Mode) when no computer is attached. Source: [Mobile development](https://docs.obsidian.md/Plugins/Getting+started/Mobile+development); hot-reload README; forum threads 20913 and 29816.
- Disable and re-enable the plugin after exercising a feature and watch the console for errors; repeat the action to catch doubled listeners.

### 6.5 Beta distribution with BRAT

The official docs say "Obsidian doesn't officially support beta releases, we recommend that you use the BRAT plugin". BRAT (`TfTHacker/obsidian42-brat`, MIT, 2.2.0) installs a plugin from a GitHub repository path and tracks its releases. Developer rules from its guide: create a release with a semantic-version tag (pre-release flag optional) and attach `main.js`, `manifest.json` and optionally `styles.css`; since BRAT 1.1.0 the release assets are the source of truth and `manifest-beta.json` is ignored; tag, release name and the asset manifest's version must match; do not bump the default-branch `manifest.json` during a beta, because Obsidian's updater keys off it; Obsidian does not implement pre-release ordering, so users on `1.0.1-beta.1` will not be offered `1.0.1`, only `1.0.2`; anonymous GitHub API access is limited to 60 requests an hour, so testers may need a personal access token. Source: [Beta-testing plugins](https://docs.obsidian.md/Plugins/Releasing/Beta-testing+plugins); [BRAT developer guide](https://github.com/TfTHacker/obsidian42-brat/blob/e9484d8f74b3b75ef59e33c9c9db139abaf039af/BRAT-DEVELOPER-GUIDE.md).

### 6.6 Automated checks that stand in for review

| Check | Tool | Catches |
|---|---|---|
| Type check | `tsc --noEmit` with the template's strict `tsconfig.json` | Type errors; wrong API shapes. |
| Official lint | `eslint .` with `eslint-plugin-obsidianmd` `configs.recommended` in a flat config with `parserOptions.projectService` (type-aware rules need it); `jiti` lets ESLint read the `.mts` config | Every rule in section 2.6, plus `@typescript-eslint/no-deprecated` (deprecated Obsidian APIs) and `no-unsupported-api` (APIs newer than `minAppVersion`). Inline `eslint-disable` of security or `obsidianmd/*` rules is itself an error. |
| Scanner parity | `obsidianmd/obsidian-workflows@v1` GitHub Action with `scanner-lint: true`, or the `scanner` section of the linter docs | Runs "the same lint configurations used by the Obsidian community directory scanner"; QuickAdd runs it in CI. Passing it does not guarantee the directory passes (section 7.6). |
| Unit tests | Vitest or Jest with an `obsidian` shim | Logic regressions. |
| Real-app tests | wdio-obsidian-service on `earliest` and `latest` | Integration with the actual API at both ends of the supported range. |
| Dependency audit | `npm audit --audit-level=high`; Dependabot (`.github/dependabot.yml` for `npm` and `github-actions`) | Known vulnerabilities, which the scanner also reports. |
| Build | `npm run build` | Produces the minified `main.js` the scanner will rebuild and compare. |
| Bundle size | esbuild `metafile` plus a budget script | Oversized bundles (community reports a 5 MB scanner limit). |
| Manifest consistency | a small script (section 10.3) | Rules in section 2.3 before the scanner sees them. |

Linter cautions reported by developers: rule semantics changed between 0.4.x minor versions (`prefer-window-timers` reversed direction), so pin the version for builds and run a second pass against the latest before release; `ui/sentence-case` configuration replaces rather than extends the default acronym list; `no-unsupported-api` misses computed property access and honours `eslint-disable` while the scanner "resolves symbols through the TypeScript compiler and ignores `eslint-disable` directives". The deprecated `eslint-plugin-deprecation` package (archived October 2024) must not be used; the current rule is typescript-eslint's `no-deprecated`. Source: [eslint-plugin README](https://github.com/obsidianmd/eslint-plugin/blob/837b01dc1647cb3f0c532becb60ea83bec137656/README.md); [obsidian-workflows](https://github.com/obsidianmd/obsidian-workflows); forum threads 112169, 116376, 119291; [typescript-eslint no-deprecated](https://typescript-eslint.io/rules/no-deprecated/).

### 6.7 Acceptance gates

A change is complete when: type check, lint (zero errors, no new warnings), unit tests and build pass; the feature works in the development vault on desktop and under mobile emulation (unless desktop-only); disable and re-enable leaves no console errors; any new API use is at or below `minAppVersion` or the version was raised deliberately; and the README still describes what the plugin does with the network and the file system. Section 10 turns this into ordered gates with commands.

---

## 7. Submission, review and publication

### 7.1 How the process works now (Mandatory)

Submission happens once, on the community directory website. Every later release is picked up automatically from GitHub and scanned again. Source: [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin); [Set up and claim](https://docs.obsidian.md/Community+directory/Set+up+and+claim); [Manage your plugin or theme](https://docs.obsidian.md/Community+directory/Manage+your+plugin+or+theme); [FAQ](https://docs.obsidian.md/Community+directory/FAQ); [blog, 12 May 2026](https://obsidian.md/blog/future-of-plugins/).

**Who reviews.** An automated scanner run by Obsidian reviews every release against the developer policies, code quality (the published linter) and known vulnerabilities and malware. Human review continues "with a focus on popular plugins, featured plugins, and issues flagged by the community". Plugins without a human review carry the in-app suffix "This plugin has not been manually reviewed by Obsidian staff"; 6,100 of 8,685 listed plugins carried it on 10 October 2026. Reviewers can grant overrides and accept documented exceptions. **Uncertain:** whether a new plugin can request a human review, and the formal role of the people who act as reviewers on GitHub.

**Timelines.** The blog says results arrive "typically within a few minutes" and a passing plugin is "available to search and download in the app within 24 hours". The developer docs promise nothing: the directory "checks for new releases periodically". No service level or approval guarantee exists anywhere. Before May 2026, waits of three to six months were reported.

### 7.2 Prerequisites checklist

Everything below is under the developer's control and verifiable before submitting (section 10.6 gives commands).

1. A GitHub account and an Obsidian account, with GitHub connected to the community profile.
2. Source on GitHub. A public repository is normal. A private source repository is allowed only if a public repository holds the release assets and the "Obsidian Community directory" GitHub App is installed on the private one so the build can be verified. New closed-source plugins are not accepted.
3. `README.md`, `LICENSE` and `manifest.json` at the repository root (section 2.4). GitHub must recognise the licence, or the scanner warns "does not have a recognized license".
4. Manifest rules (section 2.3); sample code removed; `fundingUrl` honest.
5. `isDesktopOnly: true` if Node or Electron is used.
6. A GitHub release tagged exactly `manifest.version`, with `main.js`, `manifest.json` (and `styles.css`) attached individually. The manifest at the head of the default branch must already carry that version.
7. A `package.json` script named `build`, `build:plugin` or `compile` that is the production build. The scanner runs the first of these it finds and compares the output with the release asset.
8. README disclosures for network, accounts, payment, outside-vault access, telemetry and third-party licences (section 2.1).
9. Recommended: build-provenance attestation of the release assets with `actions/attest` (section 8.2). The scanner reports "verified GitHub artifact attestations" as a passed check.
10. Agreement to the developer policies and a maintenance pledge in the submission form: confirm "that you'll continue to support your plugin or theme, or remove or transfer it if you can no longer provide support".

### 7.3 Step by step

1. Develop from the template; run `npm run lint` clean; optionally beta-test through BRAT (section 6.5).
2. Prepare the repository root and README.
3. Bump `manifest.version`, tag, release, attach assets (section 8.1). Preferred: a tag push triggers the release workflow, which builds, attests and creates a draft release that you edit and publish.
4. Sign in at [community.obsidian.md](https://community.obsidian.md) with an Obsidian account; connect GitHub (read-only access to your public profile, to prove repository ownership). Enable "Action required notifications" to be emailed when a release fails review.
5. Plugins → New plugin → repository URL and owner (yourself or an organisation) → accept the policies and pledge → Submit. The directory reads `manifest.json` from the head of the default branch.
6. Read the results. Four sections: **Manifest**, **Releases**, **Source code**, **Build verification**. Each result is **Error**, **Warning**, **Recommendation** or **Pass**. "Warnings don't block your submission, but we recommend addressing them where you can." Errors block installation.
7. Fix by publishing a new release with an incremented version; fixes are evaluated from a release, not a branch. To test first, use **Review branch → Run preview scan** on any branch, tag or commit. Use **… → Request review** to force an immediate recheck, and **… → Check for new releases** if a release is not detected.
8. Edit the listing (icon, short and long descriptions, categories, payment type, up to five desktop screenshots at 1200 × 800 and five mobile at 900 × 1600, each 5 MB or less) and select **Publish**. The plugin "won't be installable from within Obsidian until any errors from the automated review are resolved".
9. Wait up to 24 hours. Confirm the entry in `https://community.obsidian.md/assets/community-plugins.json` and in Settings → Community plugins → Browse. The `obsidian-releases` mirror runs hourly.
10. Announce in the forum's "Share & showcase" category and, with the developer role, the Discord `#updates` channel.

### 7.4 What the scanner checks

**Published half (the linter).** The directory runs `eslint-plugin-obsidianmd` with its recommended configuration, downgrading most rules to warnings. Only these stay at error: `no-eval`, `no-implied-eval`, `no-unsanitized/method`, `no-unsanitized/property`, `obsidianmd/regex-lookbehind`, `obsidianmd/no-forbidden-elements`. Disabled in the scanner: `no-undef`, the `@typescript-eslint/no-unsafe-*` rules, `restrict-template-expressions`, `no-base-to-string`, `import/no-unresolved`, `validate-manifest`, `validate-license`, and the two command-ID rules, which the directory "handles separately" or found too noisy. Ignored paths: `node_modules`, `dist`, `build`, `pkg`, `.pnpm-store`, `.obsidian`, `test-vault`, `esbuild.config.mjs`, `version-bump.mjs`, `vite*`, `scripts/`, test files and folders (`*.test.*`, `*.spec.*`, `test/`, `tests/`, `__tests__/`, `mocks/`, `__mocks__/`, `testUtils*`), `.cjs`/`.mjs`/`.cts`/`.mts` files, `docs/`, localisation folders, `automation/`, `e2e-tests/`. Source: [docs/configuration.md](https://github.com/obsidianmd/eslint-plugin/blob/837b01dc1647cb3f0c532becb60ea83bec137656/docs/configuration.md).

**Unpublished half (observed in 2026 review notices).** Dependency vulnerability advisories; obfuscation and malware detection (one false positive on bundled Prettier); cryptographic verification of attestations (failed where an "immutable release" lacked a per-asset attestation); byte-for-byte reproduction of `main.js` from the build script; CSS checks on `styles.css` (`!important`, `:has`, features unsupported at `minAppVersion`); licence recognition; README and manifest English text; name and id policy. **Uncertain:** the full rule set, weights behind the listing's "Health" score, and whether esbuild minification can trigger the obfuscation detector.

### 7.5 Common reasons for failure, ranked by evidence

Evidence: 74 "Action required: your plugin release failed automated review" issues opened by Obsidian engineer Tony Grosinger on 27 August 2026 (37 closed by 10 October), detailed findings in several of them, the scanner's error list, the retired validation workflow, and forum threads. Frequencies are not published; the ranking weighs error severity and how often each appears.

1. Unsafe HTML injection (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`). Error.
2. Creating `<style>`/`<link>` elements or inline styles instead of `styles.css`. Error.
3. `eslint-disable` comments silencing restricted rules. Error in the recommended config; the scanner ignores the comments anyway.
4. Release problems: tag not equal to version (including a `v` prefix), missing `main.js` or `manifest.json` assets, assets only inside a zip, attestation failures.
5. Manifest and naming: "Obsidian" or "Plugin" in id or name, bad id characters, description too long or not ending in a period, `fundingUrl` left as the template placeholder, `authorUrl` pointing at obsidian.md.
6. Known-vulnerable or banned dependencies.
7. `eval`, `new Function`, implied eval. Error; exception only with a written justification a reviewer accepts.
8. Regex lookbehind while not desktop-only. Error.
9. Node or Electron use with `isDesktopOnly: false`.
10. Leftover sample code or placeholder class names. Error in the linter.
11. Warnings that pile up and degrade the listing's score: console logging, `localStorage`, global `app`, `navigator`, `document.createElement`, `as any`, `!important`, `:has`, settings headings, default hotkeys, "command" in command names, `Vault.modify` on the active file, `var`, unawaited promises, bare `setTimeout`.
12. Missing or unrecognised licence; missing usage text; undisclosed network, account, payment or telemetry.
13. Process friction: fixes count only after a new release; detection is periodic; the dashboard is visible only to the entry owner, so teams should use an organisation.

Representative cases (all accessed 10 October 2026): [WeWrite issue 27](https://github.com/learnerchen-forever/wewrite/issues/27) (innerHTML, style elements, `!important`, `:has`, a `js-yaml` advisory; fixed over three weeks); [Latex Suite issue 624](https://github.com/artisticat1/obsidian-latex-suite/issues/624) (attestation "failed cryptographic verification"); [Plugins Annotations issue 27](https://github.com/alberti42/obsidian-plugins-annotations/issues/27) (name contains "Plugin"; override granted because grandfathered); [Format with Prettier issue 80](https://github.com/alexgavrusev/obsidian-format-with-prettier/issues/80) (obfuscation false positive, unlocked by a reviewer); [Hydrate issue 1](https://github.com/hydrateagent/hydrate/issues/1) (`new Function` exception accepted); [Margin Comments issue 39](https://github.com/jonaas-dev/obsidian-margin-comments/issues/39) (a new submission passing with "the build reproduced `main.js` byte-for-byte", listed the next day).

### 7.6 What the developer controls and what Obsidian decides

Under the developer's control: everything in sections 7.2 and 10.6, a lint-clean build, honest disclosures, test folders named so they are ignored, and a preview scan before each release. Obsidian decides: the scanner's exact rules and severities and their future changes; false-positive handling and exceptions; whether and when a human reviews; the "not manually reviewed" suffix and any featured status; removal of unmaintained or broken plugins; name, id and repository transfers; propagation time; and the policies themselves. Developers report that passing the published linter locally does not guarantee the directory passes. No checklist guarantees approval. Source: forum threads 116376 and 119291; blog.

### 7.7 The retired pull-request process (context only)

Until 15 May 2026 a developer appended an entry to `community-plugins.json` in `obsidianmd/obsidian-releases` and opened a pull request. A validation action checked the entry and manifest (the same id, name, description and release rules that survive today), labelled the pull request "Ready for review" or "Validation failed", and a closed-source bot scanned the code; human reviewers then applied labels such as "Changes requested" or "Minor changes requested". All pull requests have since been purged from the repository, so their review comments are not retrievable. Third-party guides describing this process are out of date. Source: `obsidian-releases` at `791be02fbd` (17 October 2025, last revision before deletion) and at `4c7bf76`; forum threads 75930, 110295, 110239.

---

## 8. Maintenance and updates

### 8.1 Releasing a new version (Mandatory mechanics)

A new version needs no resubmission: "You only need to submit the initial version." Publish a GitHub release and the directory re-scans it. Source: Submit your plugin; FAQ.

1. If the release uses an API newer than the current `minAppVersion`, raise `minAppVersion` in `manifest.json` by hand and commit. The linter's `no-unsupported-api` rule fails until you do.
2. Run `npm version patch|minor|major` from a clean tree. The npm lifecycle bumps `package.json`, runs `version-bump.mjs` (copies the new version into `manifest.json` and adds `versions.json[newVersion] = minAppVersion` if that key is absent), commits, and tags. The template's `.npmrc` sets `tag-version-prefix=""` so the tag is `1.0.1`, not `v1.0.1`.
3. Push the commit and the tag. The release workflow builds, attests and creates a draft release with the assets.
4. Add release notes ("Add release notes to let users know what happened in this release"; Obsidian ignores the release title) and publish the draft.
5. Watch the directory dashboard or the notification email for the new scan result.

Source: template `version-bump.mjs`, `.npmrc`, `package.json` at `07ceb81`; [Release your plugin with GitHub Actions](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions); [npm version](https://docs.npmjs.com/cli/v11/commands/npm-version).

### 8.2 The release workflow

The official page's workflow, with the template's newer action versions in brackets:

```yaml
name: Release Obsidian plugin
on:
  push:
    tags: ["*"]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
      attestations: write
    steps:
      - uses: actions/checkout@v3            # template: @v6
      - uses: actions/setup-node@v3          # template: @v6, node-version 24, cache npm
        with:
          node-version: "18.x"
      - run: npm install && npm run build    # template: npm ci && npm run build
      - uses: actions/attest@v4
        with:
          subject-path: |
            main.js
            manifest.json
            styles.css
      - env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          tag="${GITHUB_REF#refs/tags/}"
          gh release create "$tag" --title="$tag" --draft main.js manifest.json styles.css
```

Enable "Read and write permissions" under the repository's Settings → Actions → General → Workflow permissions. Remove `styles.css` from both steps if you do not ship one; the template makes that conditional. Attestation "is recommended when you submit a plugin to the community directory"; attest each asset individually, since a bundled attestation failed verification in one 2026 case. Alternatives seen in the community: `obsidianmd/obsidian-workflows@v1` with `mode: release`, `softprops/action-gh-release` (obsidian-git), `semantic-release` with `semantic-release-obsidian-plugin` (BRAT), `commit-and-tag-version` changelogs (obsidian-git). Source: official release page; template `release.yml`; section 9 repositories.

### 8.3 Keeping up with Obsidian

- **Every release is re-scanned, and a failing latest release delists the plugin.** For plugins listed before May 2026, scans were informational until 30 October 2026; after that date a failing latest release "will no longer be listed in the directory or installable". A forum report (20 August 2026) says a plugin is currently delisted when an update fails and that a fix to keep the last passing version is in progress with no date. **Uncertain:** current behaviour. Source: notice text in [tgrosinger/test-plugin issue 1](https://github.com/tgrosinger/test-plugin/issues/1); forum thread 116012.
- **Deprecated APIs.** `obsidian.d.ts` carries fifteen `@deprecated` tags (for example `Workspace.activeLeaf`, `MarkdownRenderer.renderMarkdown`, `Notice.noticeEl`, `SettingTab.display`) and about 870 `@since` tags. The linter's `@typescript-eslint/no-deprecated` (warn) and `no-unsupported-api` (error) rules turn both into build-time checks. Raise `no-deprecated` to error in your own config.
- **Track changes.** Read "API:" lines in [obsidian.md/changelog](https://obsidian.md/changelog) (desktop and mobile). The API repository's `CHANGELOG.md` stops at 1.7.2. Pin `obsidian` exactly in `devDependencies`, let Dependabot propose bumps, and run type check and lint after each bump so new `@deprecated` and `@since` data applies. `npm diff --diff=obsidian@<old> --diff=obsidian@<new>` shows exactly what changed (**not exercised here**).
- **`minAppVersion` policy.** Raise it only when you use a newer API; when you do, `versions.json` lets users on older apps keep installing the last compatible release. Long-lived plugins carry one `versions.json` line per release (Omnisearch 172, Tasks 143).
- **Dependencies.** Dependabot or Renovate for `npm` and `github-actions`; `npm audit` and `npm outdated` quarterly; re-check that README disclosures still match behaviour.
- **Automated re-test on new Obsidian versions.** The wdio sample plugin's `check_for_new_obsidian.yaml` runs nightly and triggers the test workflow when a new Obsidian version appears. Source: [wdio-obsidian-service-sample-plugin](https://github.com/jesse-r-s-hines/wdio-obsidian-service-sample-plugin).

### 8.4 Changing the listing, the repository or the owner

| Change | How |
|---|---|
| Name, description, icon, categories, screenshots, payment type | Edit `manifest.json` (name) and **Edit listing** in the dashboard. An invalid new name delists the plugin until fixed. |
| Plugin id | Not possible after publication. Ask in Discord `#community-directory`; changing it resets download counts and forces every user to reinstall. |
| Repository moved to another GitHub user or organisation | Admin-only; request in Discord with old and new locations and the original author's consent. |
| Directory ownership | **Transfer ownership** to an organisation you belong to or to another person by their community handle. Only the owner sees the dashboard and submits releases; use an organisation for teams. |
| Remove the plugin | **… → Archive**; reversible with **Unarchive**. |
| Payment type | **Free** (no payments), **Optional payment** (a paid third-party service is relied on, or features are locked behind payment), **Paid** (unusable without payment). A free alternative to a paid service, or a limited trial, does not make a plugin Free. |

Source: Manage your plugin or theme; FAQ.

### 8.5 Ongoing responsibilities

The submission form includes a pledge to keep supporting the plugin or to remove or transfer it. Obsidian "may also remove plugins or themes that have become unmaintained or severely broken"; of 175 historical removals recorded in `community-plugins-removed.json`, most were archived or deleted repositories. Users report violations first through the plugin's GitHub issues, then to Obsidian after seven days (immediately for serious cases). Respond to issues; keep a `CHANGELOG.md` or release notes; state in the README when not to use the plugin (community advice from Dmitriy Yurkin, 20 May 2026). Source: Set up and claim; Developer policies; obsidian-releases `community-plugins-removed.json` at `4c7bf76`; [dev.to, "Life after the merge"](https://dev.to/dimagious/life-after-the-merge-why-publishing-an-obsidian-plugin-is-just-the-beginning-1pga).

---

## 9. Reference implementations and code examples

### 9.1 How repositories were chosen

Twenty-five repositories were shallow-cloned on 10 October 2026 and swept for TypeScript strictness, tests, release automation, mobile handling, maintenance recency and deprecated patterns (`activeLeaf`, `innerHTML`, global `app`, `vault.modify`, `as any`, `var`). Popularity was not a criterion. Dropped after assessment: Excalidraw (AGPL, 106,000 lines, no unit tests), Calendar (last commit 2022), Periodic Notes (last release 2022), Style Settings (licence contradiction, stale), Metadata Menu (no tests, legacy lint, `var` and `innerHTML`). Licence is taken from the `LICENSE` file; where `package.json` disagrees, the `LICENSE` file is treated as authoritative. Line numbers are at the stated commit and were read in the clone; every blob link below pins that commit.

**Reuse rules by licence.** MIT, 0BSD and ISC code may be copied and adapted with the attribution the licence requires (0BSD requires none). GPL-3.0 and AGPL-3.0 code may be studied, but copying it obliges the new plugin to adopt a compatible licence; such repositories are linked, not excerpted. This is a statement of the licence terms, not legal advice.

### 9.2 Official repositories

| Repository | Commit; version | Licence | Why study it | Start here |
|---|---|---|---|---|
| [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin) | `07ceb81d`; template 1.0.0 (2 Aug 2026) | 0BSD | What reviewers expect a plugin to look like in 2026: `src/main.ts` plus `src/settings.ts`, strict tsconfig, official flat ESLint config, esbuild externals, version bump script, attested release workflow, `AGENTS.md`. No tests, no view, no file I/O; settings tab still uses the pre-1.13 `display()`. | [`src/main.ts` L17–102](https://github.com/obsidianmd/obsidian-sample-plugin/blob/07ceb81d1fb3384af611ebf665a1ec42a7e5926d/src/main.ts#L17-L102) (commands, `registerDomEvent`, `registerInterval`, settings load); [`esbuild.config.mjs` L13–49](https://github.com/obsidianmd/obsidian-sample-plugin/blob/07ceb81d1fb3384af611ebf665a1ec42a7e5926d/esbuild.config.mjs#L13-L49); [`version-bump.mjs`](https://github.com/obsidianmd/obsidian-sample-plugin/blob/07ceb81d1fb3384af611ebf665a1ec42a7e5926d/version-bump.mjs); [`release.yml`](https://github.com/obsidianmd/obsidian-sample-plugin/blob/07ceb81d1fb3384af611ebf665a1ec42a7e5926d/.github/workflows/release.yml); [`eslint.config.mts`](https://github.com/obsidianmd/obsidian-sample-plugin/blob/07ceb81d1fb3384af611ebf665a1ec42a7e5926d/eslint.config.mts) |
| [obsidian-api](https://github.com/obsidianmd/obsidian-api) | `9abd9605`; npm 1.14.4 (5 Oct 2026) | MIT | The only authoritative record of which API exists at which version (`@since`), what is deprecated, and usage examples in comments. No GitHub releases; `CHANGELOG.md` ends at 1.7.2. | `obsidian.d.ts`: [`Plugin` L7120–7368](https://github.com/obsidianmd/obsidian-api/blob/9abd9605ce081383674aae1ed111c456edde0688/obsidian.d.ts#L7120-L7368); [`PluginSettingTab` L7431–7458](https://github.com/obsidianmd/obsidian-api/blob/9abd9605ce081383674aae1ed111c456edde0688/obsidian.d.ts#L7431-L7458); [`display()` deprecation L9289–9303](https://github.com/obsidianmd/obsidian-api/blob/9abd9605ce081383674aae1ed111c456edde0688/obsidian.d.ts#L9289-L9303); [deferred views L11256–11267](https://github.com/obsidianmd/obsidian-api/blob/9abd9605ce081383674aae1ed111c456edde0688/obsidian.d.ts#L11256-L11267); [`requestUrl` L7841–7890](https://github.com/obsidianmd/obsidian-api/blob/9abd9605ce081383674aae1ed111c456edde0688/obsidian.d.ts#L7841-L7890); [`Vault.process` L10382](https://github.com/obsidianmd/obsidian-api/blob/9abd9605ce081383674aae1ed111c456edde0688/obsidian.d.ts#L10382); [`processFrontMatter` L4442–4450](https://github.com/obsidianmd/obsidian-api/blob/9abd9605ce081383674aae1ed111c456edde0688/obsidian.d.ts#L4442-L4450) |
| [obsidian-importer](https://github.com/obsidianmd/obsidian-importer) | `9e574b81`; 3.1.14 (7 Oct 2026) | MIT | Written by the Obsidian team: `Platform`-guarded Node access, `normalizePath` everywhere, `requestUrl` with explicit status handling, `processFrontMatter` with timestamps, `SettingGroup`/`SettingPage`, protocol handler for OAuth, tests without Obsidian, CI with type check, lint, tests and build, attested release, build script that calls the Obsidian CLI to reload. Large and converter-heavy; no custom view or editor extension; some `as any` in Notion code. `minAppVersion` 1.13.0. | [`src/main.ts` L28–106](https://github.com/obsidianmd/obsidian-importer/blob/9e574b819ddfe3179837143e9db5e79140463924/src/main.ts#L28-L106); [`src/filesystem.ts` L72–110](https://github.com/obsidianmd/obsidian-importer/blob/9e574b819ddfe3179837143e9db5e79140463924/src/filesystem.ts#L72-L110); [`src/format-importer.ts` L1361–1391](https://github.com/obsidianmd/obsidian-importer/blob/9e574b819ddfe3179837143e9db5e79140463924/src/format-importer.ts#L1361-L1391); [`src/importer-setting-tab.ts`](https://github.com/obsidianmd/obsidian-importer/blob/9e574b819ddfe3179837143e9db5e79140463924/src/importer-setting-tab.ts); [`tests/shims/obsidian.ts`](https://github.com/obsidianmd/obsidian-importer/blob/9e574b819ddfe3179837143e9db5e79140463924/tests/shims/obsidian.ts); [`.github/workflows/ci.yml`](https://github.com/obsidianmd/obsidian-importer/blob/9e574b819ddfe3179837143e9db5e79140463924/.github/workflows/ci.yml); [`esbuild.config.mjs`](https://github.com/obsidianmd/obsidian-importer/blob/9e574b819ddfe3179837143e9db5e79140463924/esbuild.config.mjs) |
| [eslint-plugin](https://github.com/obsidianmd/eslint-plugin) | `837b01dc`; npm 0.4.2 (24 Aug 2026) | MIT | Each rule is a reviewer expectation in code; the `docs/rules/` folder explains each with examples. Repository head is newer than npm 0.4.2, so check `npx eslint --print-config src/main.ts` for the rules actually active. | [`README.md` rule table](https://github.com/obsidianmd/eslint-plugin/blob/837b01dc1647cb3f0c532becb60ea83bec137656/README.md); [`docs/configuration.md`](https://github.com/obsidianmd/eslint-plugin/blob/837b01dc1647cb3f0c532becb60ea83bec137656/docs/configuration.md); [`lib/rules/`](https://github.com/obsidianmd/eslint-plugin/tree/837b01dc1647cb3f0c532becb60ea83bec137656/lib/rules) |
| [obsidian-sample-theme](https://github.com/obsidianmd/obsidian-sample-theme) | `beff4151` (14 Aug 2026) | 0BSD | Only for CSS conventions: overrides Obsidian variables rather than hard-coding values. | [`theme.css`](https://github.com/obsidianmd/obsidian-sample-theme/blob/beff4151e60c2aa12088d4ccffbfb223394db0fd/theme.css) |

### 9.3 Community repositories

| Repository | Commit; version | Licence | Why study it | Limitations | Start here |
|---|---|---|---|---|---|
| [obsidian-tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) | `84704d3d`; 8.5.0 (10 Oct 2026) | MIT | Most thoroughly tested community plugin (178 Vitest files). A cache that waits for the first `resolved`, re-indexes on `changed`, handles create, delete and rename, serialises with a mutex and debounces. Code-block processor with `MarkdownRenderChild` through `ctx.addChild`. CodeMirror `ViewPlugin`. Settings tab supporting both `getSettingDefinitions()` and `display()` behind `requireApiVersion`. CI runs build, lint, tests and a circular-dependency check. | `minAppVersion` 1.8.7 forces dual settings code; release workflow uses the archived `actions/create-release@v1` and `::set-output`; Yarn in CI. | [`src/Obsidian/Cache.ts`](https://github.com/obsidian-tasks-group/obsidian-tasks/blob/84704d3d3c56fb46fcb4015338f82a664b7f3567/src/Obsidian/Cache.ts); [`src/Renderer/QueryRenderer.ts` L45–73](https://github.com/obsidian-tasks-group/obsidian-tasks/blob/84704d3d3c56fb46fcb4015338f82a664b7f3567/src/Renderer/QueryRenderer.ts#L45-L73); [`src/Config/SettingsTab.ts` L95–170](https://github.com/obsidian-tasks-group/obsidian-tasks/blob/84704d3d3c56fb46fcb4015338f82a664b7f3567/src/Config/SettingsTab.ts#L95-L170); [`vitest.config.ts`](https://github.com/obsidian-tasks-group/obsidian-tasks/blob/84704d3d3c56fb46fcb4015338f82a664b7f3567/vitest.config.ts); [`tests/__mocks__/obsidian.ts`](https://github.com/obsidian-tasks-group/obsidian-tasks/blob/84704d3d3c56fb46fcb4015338f82a664b7f3567/tests/__mocks__/obsidian.ts) |
| [obsidian-git](https://github.com/Vinzent03/obsidian-git) | `ee068b61`; 2.41.1 (2 Oct 2026) | MIT | Strictest TypeScript in the set (`strict`, `noUncheckedIndexedAccess`, zero `as any`). Five `ItemView`s hosting Svelte 5, deferred-view checks, open-or-reveal logic, view state, `onExternalSettingsChange`, multi-step settings migration, declarative settings with `validate` and `disabled`, and a desktop (Node `child_process`) versus mobile (pure JavaScript) strategy chosen by `Platform.isDesktopApp`. `minAppVersion` 1.13.0. | `console.log` on load and unload; one inline style in a modal; a module-level plugin reference. | [`src/main.ts` L173–199, L302–365, L481–576](https://github.com/Vinzent03/obsidian-git/blob/ee068b6110579ecb53332ce530b969902d9e2cd1/src/main.ts#L173-L199); [`src/setting/settings.ts` L57–215](https://github.com/Vinzent03/obsidian-git/blob/ee068b6110579ecb53332ce530b969902d9e2cd1/src/setting/settings.ts#L57-L215); [`src/ui/sourceControl/sourceControl.ts`](https://github.com/Vinzent03/obsidian-git/blob/ee068b6110579ecb53332ce530b969902d9e2cd1/src/ui/sourceControl/sourceControl.ts); [`src/ui/diff/diffView.ts` L50–73](https://github.com/Vinzent03/obsidian-git/blob/ee068b6110579ecb53332ce530b969902d9e2cd1/src/ui/diff/diffView.ts#L50-L73); [`src/promiseQueue.ts`](https://github.com/Vinzent03/obsidian-git/blob/ee068b6110579ecb53332ce530b969902d9e2cd1/src/promiseQueue.ts); [`esbuild.config.mjs` L20–65](https://github.com/Vinzent03/obsidian-git/blob/ee068b6110579ecb53332ce530b969902d9e2cd1/esbuild.config.mjs#L20-L65) |
| [quickadd](https://github.com/chhoumann/quickadd) | `2201fa7c`; 2.32.1 (10 Oct 2026) | MIT | Promise-returning `Modal` and `FuzzySuggestModal` wrappers; sixteen named, idempotent, flag-recorded migrations with retry; migration of API keys into `SecretStorage` with fallback; settings writer that reconciles with `data.json` changed on disk; declarative settings bridged to a store; Svelte in views; 603 Vitest files plus real-app tests through `obsidian-e2e`; CI on three operating systems with SHA-pinned actions. `minAppVersion` 1.13.0. | `strict: false` (but `noImplicitAny` and `strictNullChecks`); very large; multi-stage release pipeline heavier than most plugins need. | [`src/main.ts` L145–270, L331–395](https://github.com/chhoumann/quickadd/blob/2201fa7cacd5e073a1d4816a765398cefb1fcdbe/src/main.ts#L145-L270); [`src/migrations/migrate.ts`](https://github.com/chhoumann/quickadd/blob/2201fa7cacd5e073a1d4816a765398cefb1fcdbe/src/migrations/migrate.ts); [`src/migrations/migrateProviderApiKeysToSecretStorage.ts`](https://github.com/chhoumann/quickadd/blob/2201fa7cacd5e073a1d4816a765398cefb1fcdbe/src/migrations/migrateProviderApiKeysToSecretStorage.ts); [`src/gui/GenericInputPrompt/TextPromptModal.ts`](https://github.com/chhoumann/quickadd/blob/2201fa7cacd5e073a1d4816a765398cefb1fcdbe/src/gui/GenericInputPrompt/TextPromptModal.ts); [`src/gui/GenericSuggester/SuggesterModal.ts`](https://github.com/chhoumann/quickadd/blob/2201fa7cacd5e073a1d4816a765398cefb1fcdbe/src/gui/GenericSuggester/SuggesterModal.ts); [`vitest.config.mts`](https://github.com/chhoumann/quickadd/blob/2201fa7cacd5e073a1d4816a765398cefb1fcdbe/vitest.config.mts) |
| [obsidian42-brat](https://github.com/TfTHacker/obsidian42-brat) | `e9484d8f`; 2.2.0 (1 Jul 2026) | MIT | Small, strict, current. REST calls through `requestUrl` with rate-limit headers turned into typed errors; `SecretComponent` plus `secretStorage` for a personal access token with a one-time migration logged in a plugin-folder file; fully declarative settings with a `render` callback and `display()` fallback; `semantic-release`. `minAppVersion` 1.11.4. | No automated tests; relies on internal `app.plugins` APIs by nature; start-up work scheduled by timers. | [`src/main.ts` L26–81](https://github.com/TfTHacker/obsidian42-brat/blob/e9484d8f74b3b75ef59e33c9c9db139abaf039af/src/main.ts#L26-L81); [`src/features/githubUtils.ts` L649–700](https://github.com/TfTHacker/obsidian42-brat/blob/e9484d8f74b3b75ef59e33c9c9db139abaf039af/src/features/githubUtils.ts#L649-L700); [`src/ui/SettingsTab.ts` L51–139, L756–800](https://github.com/TfTHacker/obsidian42-brat/blob/e9484d8f74b3b75ef59e33c9c9db139abaf039af/src/ui/SettingsTab.ts#L51-L139); [`src/migrations.ts`](https://github.com/TfTHacker/obsidian42-brat/blob/e9484d8f74b3b75ef59e33c9c9db139abaf039af/src/migrations.ts); [`.releaserc.yaml`](https://github.com/TfTHacker/obsidian42-brat/blob/e9484d8f74b3b75ef59e33c9c9db139abaf039af/.releaserc.yaml) |
| [tasknotes](https://github.com/callumalpass/tasknotes) | `69535cd9`; 4.13.8 (2 Oct 2026) | MIT | Closest domain match for task notes with front matter. Most complete deferred-view handling (`setViewState` → `revealLeaf` → `loadIfDeferred`); views whose `onClose` disconnects observers, clears timers and `offref`s events; a per-file mutation queue around `processFrontMatter` and `vault.process`; settings declarative on 1.13 and imperative below; Jest with `obsidian-test-mocks`; architecture conformance script; bundle-size guard; release workflow that stamps the manifest from the tag. `minAppVersion` 1.12.2. | Very large (about 174,000 lines in `src/`); OAuth client secrets injected at build time from CI secrets. | [`src/ui/WorkspaceNavigationService.ts` L17–81](https://github.com/callumalpass/tasknotes/blob/69535cd956d11474b980deef8429ff0be232185f/src/ui/WorkspaceNavigationService.ts#L17-L81); [`src/core/VaultMutationService.ts` L17–80](https://github.com/callumalpass/tasknotes/blob/69535cd956d11474b980deef8429ff0be232185f/src/core/VaultMutationService.ts#L17-L80); [`src/views/PomodoroView.ts` L213–290](https://github.com/callumalpass/tasknotes/blob/69535cd956d11474b980deef8429ff0be232185f/src/views/PomodoroView.ts#L213-L290); [`src/settings/TaskNotesSettingTab.ts` L25–72](https://github.com/callumalpass/tasknotes/blob/69535cd956d11474b980deef8429ff0be232185f/src/settings/TaskNotesSettingTab.ts#L25-L72); [`jest.config.js`](https://github.com/callumalpass/tasknotes/blob/69535cd956d11474b980deef8429ff0be232185f/jest.config.js); [`scripts/run-architecture-conformance.mjs`](https://github.com/callumalpass/tasknotes/blob/69535cd956d11474b980deef8429ff0be232185f/scripts/run-architecture-conformance.mjs) |
| [obsidian-dataview](https://github.com/blacksmithgu/obsidian-dataview) | `5ad0994f`; 0.5.68 in clone, release 0.5.70 (7 Apr 2025) | MIT | Clearest background-indexing architecture: a `Component`-derived index whose children are `addChild`-ed, a Web Worker pool with `register(() => worker.terminate())`, IndexedDB persistence, priority-ordered post-processors. | Unmaintained since April 2025; `minAppVersion` 0.13.11 predates deferred views and `getFileByPath`; two-argument `Object.assign` mutates defaults; `innerHTML = ""` clears; 47 `as any`; Rollup; no release automation. Study the architecture, not the API usage. | [`src/main.ts` L45–110](https://github.com/blacksmithgu/obsidian-dataview/blob/5ad0994ff384cbb797de382e7edff2388141b73a/src/main.ts#L45-L110); [`src/data-index/index.ts` L12–120](https://github.com/blacksmithgu/obsidian-dataview/blob/5ad0994ff384cbb797de382e7edff2388141b73a/src/data-index/index.ts#L12-L120); [`src/data-import/web-worker/import-manager.ts`](https://github.com/blacksmithgu/obsidian-dataview/blob/5ad0994ff384cbb797de382e7edff2388141b73a/src/data-import/web-worker/import-manager.ts) |
| [obsidian-kanban](https://github.com/mgmeyers/obsidian-kanban) | `5134c05a`; 2.0.51 (31 May 2024) | GPL-3.0 (`package.json` says MIT; LICENSE governs). Link only. | The only candidate implementing a `TextFileView` that replaces the Markdown editor for files with a front-matter key, switching a leaf back and forth with `setViewState`, and per-window Preact roots. | Global `app`, `as any` throughout, vendored code with `var` and `innerHTML`, monkey patches of core, no tests, stale toolchain, no release in two years. | [`src/main.ts` L98–135, L283–357](https://github.com/mgmeyers/obsidian-kanban/blob/5134c05ad9a7861f551cd15d57cf50db8394901a/src/main.ts#L98-L135); [`src/KanbanView.tsx` L31–60, L168–269](https://github.com/mgmeyers/obsidian-kanban/blob/5134c05ad9a7861f551cd15d57cf50db8394901a/src/KanbanView.tsx#L31-L60) |
| [obsidian-omnisearch](https://github.com/scambier/obsidian-omnisearch) | `0a4e93b2`; 1.31.0 (5 Sep 2026) | GPL-3.0. Link only. | Vault-event indexing registered inside `onLayoutReady` with `instanceof TFile` narrowing; IndexedDB cache; desktop-only HTTP server loaded by dynamic `import()`. Does not use a Web Worker. | Internal API access through `(this.app as any).plugins`; a global `blur` listener not registered through `registerDomEvent`. | [`src/main.ts` L63–165](https://github.com/scambier/obsidian-omnisearch/blob/0a4e93b2ed155b84c3fe89f6d2d19c5a8c171a87/src/main.ts#L63-L165) |
| [advanced-tables-obsidian](https://github.com/tgrosinger/advanced-tables-obsidian) | `1a222399`; 0.23.2 (13 May 2026) | GPL-3.0. Link only. | Smallest complete example (six files) of an `editorCheckCallback` factory, twenty-plus commands without hotkeys, a CodeMirror keymap with `Prec.highest`, and a sidebar `ItemView` opened with `getRightLeaf(false)` then `revealLeaf`. | `onload` fires an unawaited async method; `isMobile` is a function tested as a value, so a warning can never show; `loadSettings` writes on every load. | [`src/main.ts` L272–353](https://github.com/tgrosinger/advanced-tables-obsidian/blob/1a222399690f1d014d4bc95bf9ccf162ee5d7c75/src/main.ts#L272-L353) |
| [Templater](https://github.com/SilentVoid13/Templater) | `c51cf118`; 2.25.1 (19 Sep 2026) | AGPL-3.0-only. Link only. | Schema-versioned settings migration (`data_version`) that tells the user which security settings were reset; declarative settings with dot-notation keys and a confirmation modal for dangerous toggles; Node `require` guarded by `Platform.isDesktop`; `AbstractInputSuggest` pickers; the only surveyed adopter of wdio-obsidian-service with page objects. `minAppVersion` 1.13.0. | Strong copyleft; large templating engine; the end-to-end suite appears to run locally only. | [`src/settings/migrate-settings.ts`](https://github.com/SilentVoid13/Templater/blob/c51cf118fd8ad0c451dc75bc602955b8f5667145/src/settings/migrate-settings.ts); [`src/settings/Settings.ts` L133–330](https://github.com/SilentVoid13/Templater/blob/c51cf118fd8ad0c451dc75bc602955b8f5667145/src/settings/Settings.ts#L133-L330); [`wdio.conf.mts`](https://github.com/SilentVoid13/Templater/blob/c51cf118fd8ad0c451dc75bc602955b8f5667145/wdio.conf.mts); [`test/specs/autocomplete.e2e.ts`](https://github.com/SilentVoid13/Templater/blob/c51cf118fd8ad0c451dc75bc602955b8f5667145/test/specs/autocomplete.e2e.ts) |

**Tooling references.** [wdio-obsidian-service](https://github.com/jesse-r-s-hines/wdio-obsidian-service) `f4844f4f`, 3.3.0, MIT (section 6.3). [hot-reload](https://github.com/pjeby/hot-reload) `4c545496`, 0.3.1, ISC (section 3.5). [obsidian-typings](https://github.com/Fevol/obsidian-typings) `fe6eb020`, 6.41.0, MIT (section 4.10). [obsidian-dev-utils](https://github.com/mnaoumov/obsidian-dev-utils) `30196dfa`, 107.4.0, MIT: a large helper library and command-line tool with a `PluginBase` class and reusable implementations; none of the surveyed plugins adopt it, and its major version moves fast, so treat it as a source of patterns rather than a dependency. `obsidian-test-mocks` 7.2.0 and `obsidian-e2e` 0.12.2 were verified only from npm metadata.

### 9.4 Verified code excerpts

Each excerpt was copied from the clone at the stated commit on 10 October 2026 and is reproduced under its licence with attribution. Only MIT and 0BSD sources are excerpted. Excerpts marked "abridged" omit lines that do not affect the pattern; follow the link for the full code.

**E1 — Conditional command with `checkCallback`.** Sample plugin, 0BSD, Dynalist Inc. [`src/main.ts` L53–72](https://github.com/obsidianmd/obsidian-sample-plugin/blob/07ceb81d1fb3384af611ebf665a1ec42a7e5926d/src/main.ts#L53-L72). The command appears in the palette only when a Markdown view is active; `getActiveViewOfType` replaces the deprecated `activeLeaf`.

```ts
this.addCommand({
	id: 'open-modal-complex',
	name: 'Open modal (complex)',
	checkCallback: (checking: boolean) => {
		const markdownView =
			this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView) {
			if (!checking) {
				new SampleModal(this.app).open();
			}
			return true;
		}
		return false;
	},
});
```

**E2 — Settings load with defaults.** Sample plugin, 0BSD. [`src/main.ts` L91–101](https://github.com/obsidianmd/obsidian-sample-plugin/blob/07ceb81d1fb3384af611ebf665a1ec42a7e5926d/src/main.ts#L91-L101). The empty first argument matters: `Object.assign(DEFAULT_SETTINGS, …)` would mutate the defaults.

```ts
async loadSettings() {
	this.settings = Object.assign(
		{},
		DEFAULT_SETTINGS,
		(await this.loadData()) as Partial<MyPluginSettings>,
	);
}

async saveSettings() {
	await this.saveData(this.settings);
}
```

**E4 — Node modules only on desktop.** Official importer, MIT, Obsidian. [`src/filesystem.ts` L81–89](https://github.com/obsidianmd/obsidian-importer/blob/9e574b819ddfe3179837143e9db5e79140463924/src/filesystem.ts#L81-L89). Keeps `isDesktopOnly: false` while using Node on desktop; `typeof import()` gives types without a bundled import; tests inject real modules.

```ts
export let nodeCrypto: typeof import('node:crypto') = Platform.isDesktopApp ? window.require('node:crypto') : null;
export let fs: NodeFS = Platform.isDesktopApp ? window.require('node:original-fs') : null;
export let fsPromises: NodeFS['promises'] = Platform.isDesktopApp ? fs.promises : null!;
export let os: typeof import('node:os') = Platform.isDesktopApp ? window.require('node:os') : null;
export let path: typeof import('node:path') = Platform.isDesktopApp ? window.require('node:path') : null;
```

**E5 — Case-safe folder creation (abridged).** Official importer, MIT. [`src/format-importer.ts` L1366–1390](https://github.com/obsidianmd/obsidian-importer/blob/9e574b819ddfe3179837143e9db5e79140463924/src/format-importer.ts#L1366-L1390). `createFolder` throws for a name that differs from an existing folder only in case.

```ts
folderPath = normalizePath(folderPath);
let folder = vault.getAbstractFileByPath(folderPath)
	?? vault.getAbstractFileByPathInsensitive(folderPath);
if (folder === null || !(folder instanceof TFolder)) {
	await vault.createFolder(folderPath);
	folder = vault.getAbstractFileByPath(folderPath);
}
if (folder instanceof TFolder) {
	this.outputFolder = folder;
	return folder;
}
return null;
```

**E6 — Front matter edit preserving timestamps (abridged).** Official importer, MIT. [`src/formats/bear-bear2bk.ts` L490–508](https://github.com/obsidianmd/obsidian-importer/blob/9e574b819ddfe3179837143e9db5e79140463924/src/formats/bear-bear2bk.ts#L490-L508).

```ts
const writeOptions: DataWriteOptions = {
	ctime: metaData?.ctime,
	mtime: metaData?.mtime,
};
await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
	if (tags.length > 0) {
		frontmatter['tags'] = tags;
	}
}, writeOptions);
```

**E7 — `requestUrl` with explicit status handling.** Official importer, MIT. [`src/formats/airtable-api/api-helpers.ts` L51–65](https://github.com/obsidianmd/obsidian-importer/blob/9e574b819ddfe3179837143e9db5e79140463924/src/formats/airtable-api/api-helpers.ts#L51-L65). `throw: false` turns 4xx and 5xx into inspectable responses; the caller branches on `response.status` and reads `retry-after`.

```ts
const response = await requestUrl({
	url,
	method: 'GET',
	headers: {
		'Authorization': `Bearer ${token}`,
		'Content-Type': 'application/json',
	},
	throw: false,
});
```

**E9 — Declarative setting definitions (abridged).** obsidian-git, MIT, Vinzent03 and Denis Olehov. [`src/setting/settings.ts` L195–215](https://github.com/Vinzent03/obsidian-git/blob/ee068b6110579ecb53332ce530b969902d9e2cd1/src/setting/settings.ts#L195-L215). `validate` returns a string to reject with an inline error; `disabled` is a predicate; `key` is resolved through the tab's `getControlValue`/`setControlValue`.

```ts
{
	name: `Auto ${automatic} interval (minutes)`,
	desc: `Commit changes every X minutes. Set to 0 to disable.`,
	control: {
		type: "number",
		key: "autoSaveInterval",
		min: 0,
		step: 1,
		validate: validateInteger,
	},
},
{
	name: `Auto ${automatic} after stopping file edits`,
	control: {
		type: "toggle",
		key: "autoBackupAfterFileChange",
		disabled: () => this.settings.setLastSaveToLastCommit,
	},
},
```

**E10 — Open or reveal a custom view (abridged).** obsidian-git, MIT. [`src/main.ts` L321–341](https://github.com/Vinzent03/obsidian-git/blob/ee068b6110579ecb53332ce530b969902d9e2cd1/src/main.ts#L321-L341). No leaf is created in `onload` and none detached in `onunload`.

```ts
const leafs = this.app.workspace.getLeavesOfType(SOURCE_CONTROL_VIEW_CONFIG.type);
let leaf: WorkspaceLeaf;
if (leafs.length === 0) {
	leaf = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf();
	await leaf.setViewState({ type: SOURCE_CONTROL_VIEW_CONFIG.type });
} else {
	leaf = leafs.first()!;
}
await this.app.workspace.revealLeaf(leaf);
```

**E11 — `ItemView` hosting a Svelte 5 component.** obsidian-git, MIT. [`src/ui/sourceControl/sourceControl.ts` L31–55](https://github.com/Vinzent03/obsidian-git/blob/ee068b6110579ecb53332ce530b969902d9e2cd1/src/ui/sourceControl/sourceControl.ts#L31-L55). The same shape applies to React or Preact: mount in `onOpen`, unmount in `onClose`.

```ts
    async onClose(): Promise<void> {
        if (this._view) {
            await unmount(this._view);
        }
        return super.onClose();
    }

    async reload(): Promise<void> {
        if (this._view) {
            await unmount(this._view);
        }
        this._view = mount(SourceControlViewComponent, {
            target: this.contentEl,
            props: {
                plugin: this.plugin,
                view: this,
            },
        });
    }

    async onOpen(): Promise<void> {
        await this.reload();
        return super.onOpen();
    }
```

**E12 — Wait for the metadata cache, then index on `changed`.** Tasks, MIT, Clare Macrae, Ilyas Landikov and Martin Schenck. [`src/Obsidian/Cache.ts` L146–167](https://github.com/obsidian-tasks-group/obsidian-tasks/blob/84704d3d3c56fb46fcb4015338f82a664b7f3567/src/Obsidian/Cache.ts#L146-L167). `resolved` fires on every change, so the initial load is guarded by a flag; `changed` re-indexes one file under a mutex.

```ts
const resolvedEventeReference = this.metadataCache.on('resolved', async () => {
	if (!this.loadedAfterFirstResolve) {
		this.loadedAfterFirstResolve = true;
		void this.loadVault();
	}
});
this.metadataCacheEventReferences.push(resolvedEventeReference);

const changedEventReference = this.metadataCache.on('changed', async (file: TFile) => {
	await this.tasksMutex.runExclusive(() => this.indexFile(file));
});
this.metadataCacheEventReferences.push(changedEventReference);
```

**E13 — Vitest aliasing `obsidian` to a mock.** Tasks, MIT. [`vitest.config.ts` L8–25](https://github.com/obsidian-tasks-group/obsidian-tasks/blob/84704d3d3c56fb46fcb4015338f82a664b7f3567/vitest.config.ts#L8-L25).

```ts
export default defineConfig({
	resolve: {
		alias: {
			// Resolve 'obsidian' imports to the test mock, since the package contains only types.
			obsidian: path.resolve(dirname, 'tests/__mocks__/obsidian.ts'),
		},
	},
	test: {
		environment: 'jsdom',
		include: ['tests/**/*.test.ts'],
	},
});
```

**E14 — Deferred-view-safe activate and reveal.** TaskNotes, MIT, Callum Alpass. [`src/ui/WorkspaceNavigationService.ts` L36–59](https://github.com/callumalpass/tasknotes/blob/69535cd956d11474b980deef8429ff0be232185f/src/ui/WorkspaceNavigationService.ts#L36-L59).

```ts
async revealLeafReady(leaf: WorkspaceLeafLike): Promise<void> {
	const { workspace } = this.plugin.app;
	workspace.setActiveLeaf(leaf as WorkspaceLeaf, { focus: true });
	await workspace.revealLeaf(leaf as WorkspaceLeaf);
	if (leaf.isDeferred) {
		await leaf.loadIfDeferred();
	}
}

async activateView(viewType: string): Promise<WorkspaceLeaf> {
	const { workspace } = this.plugin.app;
	let leaf = this.getLeafOfType(viewType);
	if (!leaf) {
		leaf = workspace.getLeaf("tab");
		await leaf.setViewState({ type: viewType, active: true });
	}
	await this.revealLeafReady(leaf);
	return leaf as WorkspaceLeaf;
}
```

**E15 — Web Worker pool owned by a `Component`.** Dataview, MIT, Michael Brenan. [`src/data-import/web-worker/import-manager.ts` L33–40](https://github.com/blacksmithgu/obsidian-dataview/blob/5ad0994ff384cbb797de382e7edff2388141b73a/src/data-import/web-worker/import-manager.ts#L33-L40). The worker is produced by a bundler plugin and inlined into `main.js`; `this.register` ties its lifetime to the component.

```ts
for (let index = 0; index < numWorkers; index++) {
	let worker = new DataviewImportWorker({ name: "Dataview Indexer " + (index + 1) });
	worker.onmessage = evt => this.finish(evt.data.path, Transferable.value(evt.data.result), index);
	this.workers.push(worker);
	this.register(() => worker.terminate());
	this.busy.push(false);
}
```

**E16 — Idempotent settings-migration runner (abridged; the loop body is summarised in comments).** QuickAdd, MIT, Christian Bager Bach Houmann. [`src/migrations/migrate.ts` L40–62](https://github.com/chhoumann/quickadd/blob/2201fa7cacd5e073a1d4816a765398cefb1fcdbe/src/migrations/migrate.ts#L40-L62). Each migration is a boolean flag in `settings.migrations`; the loop marks a flag unless the migration returned `{ complete: false }`, and restores a backup on error.

```ts
async function migrate(plugin: QuickAdd): Promise<void> {
	const migrationsToRun = Object.keys(migrations).filter(
		(migration: keyof Migrations) => !plugin.settings.migrations[migration]
	);
	if (migrationsToRun.length === 0) {
		return;
	}
	for (const migration of migrationsToRun as (keyof Migrations)[]) {
		const backup = deepClone(plugin.settings);
		try {
			// run migrations[migration].migrate(plugin), set the flag, save
		} catch (error) {
			// restore backup, report
		}
	}
}
```

### 9.5 Pattern index

Links are to the repositories and commits in sections 9.2 and 9.3. Copyleft sources are marked †.

| Need | Best references |
|---|---|
| Plugin entry, settings defaults, registering commands and events | Sample `src/main.ts` L17–102 (E1, E2); importer `src/main.ts` L28–106; obsidian-git `src/main.ts` L173–199 |
| Settings tab, declarative and imperative; migrations | obsidian-git `src/setting/settings.ts` L57–215 (E9); BRAT `src/ui/SettingsTab.ts` L51–139; Tasks `src/Config/SettingsTab.ts` L95–170 (dual API); QuickAdd `src/migrations/` (E16); Templater† `src/settings/migrate-settings.ts`; guide [Migrate to declarative settings](https://docs.obsidian.md/Plugins/Guides/Migrate+to+declarative+settings) |
| Custom view: register, open or reveal, deferred views, state, cleanup | obsidian-git `src/main.ts` L302–341 (E10), `src/ui/sourceControl/sourceControl.ts` (E11), `src/ui/diff/diffView.ts` L50–73; TaskNotes `src/ui/WorkspaceNavigationService.ts` (E14), `src/views/PomodoroView.ts` L213–290; Kanban† `src/KanbanView.tsx` (`TextFileView`) |
| Modals and suggesters | Sample `src/main.ts` L104–114; importer `src/main.ts` L172–259; QuickAdd `src/gui/GenericInputPrompt/`, `src/gui/GenericSuggester/`; Templater† `src/settings/suggesters/FolderSuggester.ts` (`AbstractInputSuggest`) |
| Commands and callbacks | Sample L34–72 (E1); Advanced Tables† `src/main.ts` L326–336; obsidian-git `src/commands.ts` L9–70 |
| Vault and file operations | Importer `src/format-importer.ts` L1361–1391 (E5), `src/formats/bear-bear2bk.ts` L490–508 (E6); TaskNotes `src/core/VaultMutationService.ts`; Tasks `src/Obsidian/Cache.ts` L172–229 |
| Metadata cache and indexing | Tasks `src/Obsidian/Cache.ts` L146–167 (E12); Omnisearch† `src/main.ts` L117–165; Dataview `src/data-index/index.ts` L95–120 |
| Editor extensions and Markdown processors | Tasks `src/Obsidian/LivePreviewExtension.ts` L13–47, `src/Renderer/QueryRenderer.ts` L45–73; Advanced Tables† `src/main.ts` L272–298; Dataview `src/main.ts` L66–105 |
| Network and secrets | Importer `src/formats/airtable-api/api-helpers.ts` L51–100 (E7), `src/main.ts` L59–72 (protocol handler); BRAT `src/features/githubUtils.ts` L649–700, `src/ui/SettingsTab.ts` L756–800; QuickAdd `src/migrations/migrateProviderApiKeysToSecretStorage.ts`; guide [Store secrets](https://docs.obsidian.md/Plugins/Guides/Store+secrets) |
| Desktop and mobile split | Importer `src/filesystem.ts` L72–110 (E4); obsidian-git `src/main.ts` L549–576, `esbuild.config.mjs` L20–43; Templater† `src/core/functions/user_functions/UserSystemFunctions.ts` L16–32 |
| UI framework inside views | obsidian-git `sourceControl.ts` (E11, Svelte 5); QuickAdd `src/quickAddSettingsTab.ts` L302–330; Kanban† `src/main.ts` L283–316 (Preact per window) |
| Unit and real-app tests | Importer `tests/shims/obsidian.ts`, `tsconfig.test.json`; Tasks `vitest.config.ts` (E13), `tests/__mocks__/obsidian.ts`; TaskNotes `jest.config.js`; Templater† `wdio.conf.mts`, `test/specs/`; QuickAdd `tests/e2e/` |
| Build and release | Sample `esbuild.config.mjs`, `version-bump.mjs`, `.github/workflows/release.yml`; importer `.github/workflows/ci.yml`; obsidian-git `.github/workflows/releases.yml`, `version-bump.cjs`; BRAT `.releaserc.yaml`; TaskNotes `.github/workflows/release.yaml` |
| Styling | Importer `styles.scss` with `importer-` prefixes; TaskNotes `styles/*.css` with `tasknotes-` prefixes; sample theme `theme.css` |
| Workers and performance | Dataview `src/data-import/web-worker/import-manager.ts` (E15), `src/data-index/index.ts` L55–82; Tasks `Cache.ts` L49–53 (debounce); obsidian-git `src/promiseQueue.ts` |

---

## 10. Development workflow and compliance checklist

This section turns sections 2 to 9 into an ordered sequence with verification gates for an AI coding agent. "Passes" means exit code 0 and no new lint warnings compared with the main branch. Script names `typecheck`, `test:unit`, `test:e2e`, `check:manifest` and `check:size` are proposed additions to the template's `package.json`; they are not official. Product features and architecture come from the separate requirements and architecture documents, not from here.

### 10.1 Gate 0 — set-up verified (once per repository)

1. Node 22 or 24 installed; repository created from the template; `npm ci`, `npm run build`, `npm run lint` all pass.
2. `npx eslint --print-config src/main.ts | grep -c obsidianmd/` is greater than zero, confirming the official rules are active.
3. Manifest, `package.json`, `versions.json`, README and `LICENSE` edited per section 3.2; `node scripts/check-manifest.mjs` passes (section 10.3).
4. A dedicated development vault exists; the repository is symlinked at `<vault>/.obsidian/plugins/<id>`; a `.hotreload` file is present and git-ignored; Hot Reload or the Obsidian CLI is available.
5. The plugin is enabled in that vault, appears in Settings → Community plugins, and loads with no console errors; `this.app.emulateMobile(true)` renders.

Human judgement: the vault is not a user's real vault; licence choice; `isDesktopOnly`; initial `minAppVersion` (default to the current stable, 1.14.4 at the research date, unless older versions must be supported).

### 10.2 Gate 1 — every commit

```bash
npm run typecheck && npm run lint && npm run test:unit && npm run build
```

Passes when: zero TypeScript errors; zero ESLint errors and no increase in warnings; unit tests green; `main.js` produced. Optional: `npm audit --audit-level=high`, `npx knip`. Run the same in CI on push and pull request (extend the template's `lint.yml`, which already runs `npm ci`, `npm run build`, `npm run lint` on Node 20, 22 and 24). A pre-commit hook (husky plus lint-staged, or a plain npm script) keeps the loop under thirty seconds; real-app tests belong in CI only. No `eslint-disable` without a written justification; the configuration makes an undocumented disable an error.

### 10.3 Manifest consistency script (proposed)

A dependency-free Node script, run in Gate 1, CI and as a `preversion` hook, that exits non-zero with one line per violation:

| Check | Source of the rule |
|---|---|
| `manifest.json` is one object with required keys `id, name, version, minAppVersion, description, author, isDesktopOnly` (strings; `isDesktopOnly` boolean); optional `authorUrl`, `fundingUrl`; no other keys | Manifest reference; linter `validate-manifest` |
| `id` matches `^[a-z-]+$`, does not contain `obsidian`, does not end with `plugin`; equals the id in the previous release | Manifest reference; `AGENTS.md` |
| `name` contains no "Obsidian", "Obsi", "sidian" or "Plugin"; Basic Latin and allowed punctuation only | Manifest reference |
| `description` 10 to 250 characters, starts with a capital, ends with a period, no emoji, does not start "This is a plugin" | Submission requirements; `validate-manifest` |
| `version` matches `^\d+\.\d+\.\d+$` and equals `package.json` version | Submit your plugin; template `version-bump.mjs` |
| `versions.json` is valid JSON, has an entry for the current version, and every value is `x.y.z` | Versions reference |
| `minAppVersion` is a real Obsidian version and not newer than the installed `obsidian` types | Submission requirements |
| If `src/**` imports `fs`, `path`, `os`, `child_process`, `crypto`, `electron` or `node:*` without a `Platform` guard, `isDesktopOnly` is `true` | Submission requirements; linter `no-nodejs-modules` |
| `fundingUrl` absent, or a non-empty URL that is not `https://obsidian.md/pricing`; `authorUrl` not `https://obsidian.md` and not the plugin repository | Submission requirements; retired validator |
| `README.md`, `LICENSE`, `manifest.json` exist at the root; `LICENSE` does not still name "Dynalist Inc." | Submit your plugin; linter `validate-license` |
| On a tag build, `git describe --exact-match --tags` equals `manifest.version` | Release docs; template `.npmrc` |

### 10.4 Gate 2 — every feature, before merge

1. Build with watch running; exercise the feature in the development vault through its commands and UI; watch the console.
2. Disable and re-enable the plugin; repeat the action; confirm no doubled effects or errors (leak check).
3. `this.app.emulateMobile(true)` and repeat, unless desktop-only.
4. If configured, `npm run test:e2e` on `earliest` and `latest` with the `emulateMobile` capability; add or extend a spec for the feature.
5. If `no-unsupported-api` failed in Gate 1, raising `minAppVersion` is a product decision; record it.

Human judgement: wording in sentence case; behaviour matches the specification; acceptable `minAppVersion`.

### 10.5 Gate 3 — release candidate

1. Clean tree; `npm ci && npm run build && npm run lint && npm run test:unit && npm run test:e2e`; bundle-size check; dependency licence report; README disclosure review against section 2.1.
2. Update `CHANGELOG.md` or draft release notes; decide `minAppVersion`.
3. For a public beta: tag a pre-release such as `1.2.0-beta.1` from a branch without bumping the default-branch manifest; distribute through BRAT; remember that the final version must be a patch above the last pre-release for Obsidian to offer it (section 6.5).
4. `npm version patch|minor|major`; push commit and tag; the release workflow creates a draft.
5. Verify the draft:

```bash
TAG=$(jq -r .version manifest.json)
gh release view "$TAG" --json tagName,isDraft,assets --jq '{tagName,isDraft,assets:[.assets[].name]}'
gh release download "$TAG" -p manifest.json -O - | diff - manifest.json
gh attestation verify main.js -R <owner>/<repo>
```

Assets must include `main.js` and `manifest.json` (and `styles.css` if shipped) as separate files; the downloaded manifest must equal the committed one.

6. Install into a fresh empty vault (BRAT, or copy the three assets into `.obsidian/plugins/<id>/`); enable; smoke-test desktop and emulated mobile; on a real phone when possible.
7. Publish the draft.

Human judgement: release notes; beta duration and tester feedback; go or no-go.

### 10.6 Gate 4 — first submission

Pre-submission checklist. Each item names how it is verified.

**Accounts and repository**
- [ ] Obsidian account; GitHub connected at community.obsidian.md; "Action required notifications" on. *Manual.*
- [ ] Repository public (or private-source set-up with the GitHub App). `gh api repos/<o>/<r> -q .private` is `false`. *Automatable.*
- [ ] GitHub recognises the licence. `gh api repos/<o>/<r>/license -q .license.spdx_id` is not `NOASSERTION`. *Automatable.*
- [ ] README states purpose and usage and discloses network services and why, accounts, payment, outside-vault access, telemetry with privacy policy, third-party attributions. *Manual.*
- [ ] Not an unpermitted fork; name does not suggest first-party. *Manual.*

**Manifest and code**
- [ ] `node scripts/check-manifest.mjs` passes. *Automatable.*
- [ ] `id` unique: `curl -s https://community.obsidian.md/assets/community-plugins.json | jq -e --arg id "$(jq -r .id manifest.json)" 'map(select(.id==$id))|length==0'`. *Automatable.*
- [ ] `npx eslint . -f json | jq '[.[].messages[] | select(.severity==2)] | length'` is `0`; warnings trending to zero. *Automatable.*
- [ ] No `MyPlugin`, `SampleSettingTab`, `SampleModal`, `mySetting` in `src/`. *Automatable.*
- [ ] No `<style>`/`<link>` creation; CSS only in `styles.css`; `grep -c '!important' styles.css` low. *Automatable.*
- [ ] Settings tab: no top-level heading, no "settings" in headings, sentence case, `setHeading()`. *Lint plus screenshot.*
- [ ] `npm audit --omit=dev` clean. *Automatable.*
- [ ] Test and build folders named per the scanner ignore list. *Automatable (compare `ls` with section 7.4).*

**Build and release**
- [ ] `package.json` has a production `build` (or `build:plugin`, `compile`) script. *Automatable.*
- [ ] Clean build reproduces the release asset: `npm ci && npm run build && gh release download "$TAG" -p main.js -O /tmp/rel-main.js && cmp main.js /tmp/rel-main.js`. *Automatable.*
- [ ] Tag equals version without `v`; assets separate; attestation verifies; workflow permissions `contents: write`, `id-token: write`, `attestations: write`. *Automatable.*

**Directory**
- [ ] Review branch → Run preview scan on the release commit; all errors resolved. *Manual.*
- [ ] Submit with repository URL and owner; accept policies and pledge; payment type set honestly. *Manual (a human accepts the policies).*
- [ ] After "Passed": listing filled in, Publish selected; within 24 hours the id appears in `community-plugins.json` and in the in-app browser. *Automatable check after the wait.*
- [ ] Announce. *Manual.*

### 10.7 Gate 5 — after release, continuously

- Dependabot pull requests for `obsidian`, `esbuild`, `typescript`, `eslint*`, `wdio*` and GitHub Actions each run Gates 1 and 2.
- Nightly check for new Obsidian versions (the wdio sample's `check_for_new_obsidian.yaml`) triggers real-app tests; on failure, decide whether a fix needs a `minAppVersion` bump and update `versions.json`.
- Watch GitHub issues, directory "Action required" emails, "API:" changelog lines and `community-plugin-deprecation.json`.
- Quarterly: `npm outdated`, `npm audit`, licence report, confirm README disclosures still match behaviour, run lint against the latest `eslint-plugin-obsidianmd`.

Human judgement: triage; the support window for older Obsidian versions.

---

## 11. Limitations and unresolved questions

1. **The scanner is partly closed.** Only its ESLint half is published. Dependency, obfuscation, attestation, build-reproduction and CSS checks, and the weights behind the listing's "Health" score, are inferred from 2026 review notices. Whether esbuild minification can trigger the obfuscation detector is unknown.
2. **Linter version drift.** The repository head of `eslint-plugin-obsidianmd` is newer than npm 0.4.2; `no-unsupported-api` and some `settings-tab/*` rules may not be in the published package. Confirm with `npx eslint --print-config`.
3. **Failed updates.** Whether a plugin whose latest release fails is delisted outright or kept at its last passing version was still changing in August 2026, and the 30 October 2026 deadline for previously listed plugins had not passed at the research date.
4. **Human review for new plugins.** It is unknown whether a new plugin can request manual review to remove the "not manually reviewed" suffix, or what "Request review" triggers beyond a re-scan. The formal roles of the GitHub users who act as reviewers are not published.
5. **`display()` status.** The types deprecate it since 1.13.0; the Settings page calls it supported indefinitely as a fallback.
6. **`emulateMobile` and `App.isMobile`** are documented only on the Mobile development page and are absent from the type definitions.
7. **Tag prefix.** Official docs say the tag "must match" the version; only the template says no `v`. It is unknown whether the directory rejects `v1.0.0` or merely fails to find it. Either way, a `v` prefix breaks installation.
8. **Where the app reads the plugin list** (GitHub mirror or the directory directly) and the in-app cache interval are not documented. The 24-hour figure is from the blog.
9. **`helpUrl`** as a manifest key and the purpose of `community-plugin-deprecation.json` are undocumented.
10. **Historic review comments** from the pull-request era are gone; the failure ranking in section 7.5 rests on 2026 notices, the retired validator and the linter.
11. **Mobile.** No official way to copy a development build to a phone is documented; iOS cannot be tested automatically with any current tool; `SecretStorage` scoping on mobile is an open forum question.
12. **Toolchain.** ESLint 10 and TypeScript 7 compatibility with the template was not tested; the template pins ESLint 9 and TypeScript 5.
13. **Community sources not reached.** Discord; Liam Cain's API FAQ entries beyond the landing page; one Medium article (HTTP 403); the authorship of `obsidian-e2e`; whether Templater's real-app suite runs in CI.
14. **Nothing was executed.** Test counts are file counts; code behaviour was inferred by reading; the Advanced Tables `isMobile` defect was not confirmed at run time.
15. **No official stance on `!important`** or `:has` in CSS was found, although the scanner warns on both.

---

## 12. Source register

All sources accessed 10 October 2026 unless stated. Forum dates are post dates.

### Official: documentation (built from obsidian-developer-docs `c56c7e770ba25dd0ea392aacf4588f9425970d36`, 10 August 2026)

| Source | Used for |
|---|---|
| https://docs.obsidian.md/Community+directory/Developer+policies | Section 2.1 |
| https://docs.obsidian.md/Community+directory/Submission+requirements+for+plugins | Section 2.2 |
| https://docs.obsidian.md/Community+directory/Set+up+and+claim | Section 7.3 |
| https://docs.obsidian.md/Community+directory/Manage+your+plugin+or+theme | Sections 7.1, 7.3, 8.4 |
| https://docs.obsidian.md/Community+directory/FAQ (permalink `community-directory/faq`) | Sections 7.1–7.4, 8.4 |
| https://docs.obsidian.md/Reference/Manifest ; https://docs.obsidian.md/Reference/Versions | Section 2.3 |
| https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin | Sections 1.4, 2.4, 7 |
| https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions | Section 8.2 |
| https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines | Section 2.6 |
| https://docs.obsidian.md/Plugins/Releasing/Beta-testing+plugins | Section 6.5 |
| https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin ; …/Anatomy+of+a+plugin ; …/Development+workflow ; …/Mobile+development ; …/Use+React+in+your+plugin ; …/Use+Svelte+in+your+plugin | Sections 3, 4.1, 6.4 |
| https://docs.obsidian.md/Plugins/Guides/Optimize+plugin+load+time ; …/Defer+views ; …/Manage+plugin+lifecycle ; …/Migrate+to+declarative+settings ; …/Store+secrets ; …/Support+pop-out+windows ; …/Build+a+Bases+view | Sections 2.7, 4.2–4.8, 5.3 |
| https://docs.obsidian.md/Plugins/User+interface/{Commands, Context+menus, HTML+elements, Icons, Modals, Ribbon+actions, Right-to-left, Settings, Status+bar, Views, Workspace} ; …/Plugins/Editor/* ; …/Plugins/Vault ; …/Plugins/Events | Sections 2.5, 4 |
| Developer-docs file `en/Obsidian October plugin self-critique checklist.md` (permalink `oo/plugin`; no live URL confirmed) | Sections 2.4, 2.8 |
| Retired URLs returning Not Found: https://docs.obsidian.md/Developer+policies ; https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins | Section 1.4 |

### Official: repositories, site and packages

| Source | Version or commit | Used for |
|---|---|---|
| https://github.com/obsidianmd/obsidian-api (README, CHANGELOG.md, obsidian.d.ts, package.json) | `9abd9605ce081383674aae1ed111c456edde0688`; npm `obsidian` 1.14.4 (8 Oct 2026) | Sections 2.4, 2.5, 8.3, 9.2 |
| https://github.com/obsidianmd/obsidian-sample-plugin (all files) | `07ceb81d1fb3384af611ebf665a1ec42a7e5926d` (2 Aug 2026) | Sections 3, 8, 9 |
| https://github.com/obsidianmd/eslint-plugin (README, docs/configuration.md, docs/rules/, lib/) ; npm `eslint-plugin-obsidianmd` | `837b01dc1647cb3f0c532becb60ea83bec137656`; npm 0.4.2 (24 Aug 2026). The URL `obsidianmd/eslint-plugin-obsidianmd` does not exist. | Sections 2.6, 6.6, 7.4 |
| https://github.com/obsidianmd/obsidian-importer | `9e574b819ddfe3179837143e9db5e79140463924`; 3.1.14 | Section 9 |
| https://github.com/obsidianmd/obsidian-sample-theme | `beff4151e60c2aa12088d4ccffbfb223394db0fd` | Section 9.2 |
| https://github.com/obsidianmd/obsidian-releases (README, workflows, community-plugins.json, community-plugins-removed.json, community-plugin-deprecation.json); historical files at `791be02fbd` (17 Oct 2025) | `4c7bf7633fb704a548e7cb160b47aa23e2accd41` (10 Oct 2026) | Sections 1.4, 2.3, 7.7, 8.5 |
| https://github.com/obsidianmd/obsidian-workflows | `@v1`; MIT | Section 6.6 |
| https://obsidian.md/blog/future-of-plugins/ (kepano, 12 May 2026) | — | Sections 1.4, 7 |
| https://obsidian.md/changelog ; https://obsidian.md/download | 1.14.4 public 5 Oct 2026 | Header; section 2.5 |
| https://obsidian.md/help/cli ; https://obsidian.md/help/community-directory | — | Sections 3.5, 6.3, 7.4 |
| https://community.obsidian.md/assets/community-plugins.json | mirrored hourly | Sections 7.3, 10.6 |

### Community: repositories (shallow clones, 10 October 2026)

| Repository | Commit; version | Licence |
|---|---|---|
| https://github.com/obsidian-tasks-group/obsidian-tasks | `84704d3d3c56fb46fcb4015338f82a664b7f3567`; 8.5.0 | MIT |
| https://github.com/Vinzent03/obsidian-git | `ee068b6110579ecb53332ce530b969902d9e2cd1`; 2.41.1 | MIT |
| https://github.com/chhoumann/quickadd | `2201fa7cacd5e073a1d4816a765398cefb1fcdbe`; 2.32.1 | MIT |
| https://github.com/TfTHacker/obsidian42-brat | `e9484d8f74b3b75ef59e33c9c9db139abaf039af`; 2.2.0 | MIT |
| https://github.com/callumalpass/tasknotes | `69535cd956d11474b980deef8429ff0be232185f`; 4.13.8 | MIT |
| https://github.com/blacksmithgu/obsidian-dataview | `5ad0994ff384cbb797de382e7edff2388141b73a`; 0.5.68 (release 0.5.70) | MIT |
| https://github.com/mgmeyers/obsidian-kanban | `5134c05ad9a7861f551cd15d57cf50db8394901a`; 2.0.51 | GPL-3.0 (package.json: MIT) |
| https://github.com/scambier/obsidian-omnisearch | `0a4e93b2ed155b84c3fe89f6d2d19c5a8c171a87`; 1.31.0 | GPL-3.0 |
| https://github.com/tgrosinger/advanced-tables-obsidian | `1a222399690f1d014d4bc95bf9ccf162ee5d7c75`; 0.23.2 | GPL-3.0 |
| https://github.com/SilentVoid13/Templater | `c51cf118fd8ad0c451dc75bc602955b8f5667145`; 2.25.1 | AGPL-3.0-only |
| https://github.com/zsviczian/obsidian-excalidraw-plugin (dropped; cited for build comments and patch manager) | `f30b4c5d3dcb66ac76ced8f05d9e95409ee94c79`; 2.28.1 | AGPL-3.0 (package.json: MIT) |
| https://github.com/mgmeyers/obsidian-style-settings ; https://github.com/mdelobelle/metadatamenu ; https://github.com/liamcain/obsidian-calendar-plugin ; https://github.com/liamcain/obsidian-periodic-notes (dropped; survey only) | `8ecefa95`; `dc244cc9`; `ef3f2696`; `a8aa7e4e` | GPL-3.0; MIT; MIT; MIT |
| https://github.com/jesse-r-s-hines/wdio-obsidian-service ; https://github.com/jesse-r-s-hines/wdio-obsidian-service-sample-plugin | `f4844f4f981c46ff6860c850424fd69c87d6f7b4`, npm 3.3.0 (6 Oct 2026); sample `0e86de5b` (14 Jun 2026) | MIT; 0BSD |
| https://github.com/pjeby/hot-reload ; https://github.com/pjeby/monkey-around | `4c5454963ec4cbe847302d3063ada4b4204d7e95`, 0.3.1; `0884a10` | ISC; ISC |
| https://github.com/Fevol/obsidian-typings | `fe6eb020d6fe4359d43e69028d04aee50fa7017b`; npm 6.41.0 | MIT |
| https://github.com/mnaoumov/obsidian-dev-utils ; npm `obsidian-test-mocks` 7.2.0 ; npm `obsidian-e2e` 0.12.2 ; npm `semantic-release-obsidian-plugin` 1.2.1 | `30196dfa8b40621dddf7ee60c8cb43f81e7276a7`, 107.4.0 | MIT |

### Community: articles and forum threads

| Source | Author; date |
|---|---|
| https://boninall.com/blog/refactoring-plugins | Boninall; 3 Mar 2025 |
| https://www.moritzjung.dev/obsidian-collection/plugin-dev/testing/ (three pages) | Moritz Jung; undated |
| https://dev.to/dimagious/life-after-the-merge-why-publishing-an-obsidian-plugin-is-just-the-beginning-1pga | Dmitriy Yurkin; 20 May 2026 |
| https://dev.to/bcamphart/integration-testing-in-obsidian-1gm5 | B. Camphart; 2 May 2024 |
| https://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/Guides/How+to+add+automated+tests+to+your+plugin | Obsidian Hub; undated |
| https://forum.obsidian.md/t/call-for-plugin-performance-optimization-especially-for-plugin-startup/32321 | TfTHacker; 12 Feb 2022 |
| https://forum.obsidian.md/t/debugging-obsidian-mobile-plugins/20913 ; …/getting-my-plugin-working-on-mobile-devices/29816 | 2021–2022 |
| https://forum.obsidian.md/t/plugin-tech-stack/20867 | 14 Jul 2021 |
| https://forum.obsidian.md/t/overlapping-vault-modify-vault-process-calls-permanently-stick-file-saving/116346 | dtkav, Licat; 22 Jul 2026 |
| https://forum.obsidian.md/t/help-vault-adapter-write-vs-vault-modifybinary-for-working-with-custom-files-to-store-json-data/113621 | 23 Apr and 24 Sep 2026 |
| https://forum.obsidian.md/t/store-secrets-like-api-key-outside-of-data-json/56035 ; …/secretstorage-appears-to-be-shared-across-vaults-on-mobile-but-vault-scoped-on-desktop/117793 | 9 Mar 2023; 29 Aug 2026 |
| https://forum.obsidian.md/t/please-publish-automated-review-lint-rules-or-a-local-check-script-and-a-first-class-mobile-save-share-api-for-export-plugins/116376 ; …/no-unsupported-api-preflight-can-pass-while-the-community-catalog-rejects-the-same-plugin/119291 ; …/configuring-lint-rules/112169 | Jul–Oct 2026 |
| https://forum.obsidian.md/t/bug-custom-views-are-not-detected-while-opening-obsidian-in-onlayoutready-callback/112337 | 2025–2026 |
| https://forum.obsidian.md/t/changes-to-frontmatter-properties-from-templater-javascripts-are-not-saved/80301 ; …/note-has-been-modified-externally-notice-when-updating-frontmatter-using-templater/78628 | 2024 |
| https://forum.obsidian.md/t/why-are-plugins-delisted-if-an-update-doesn-t-pass-the-automated-review/116012 ; …/why-can-some-plugins-not-be-installed/117000 ; …/remove-this-plugin-has-not-been-manually-reviewed-from-plugin-browser-preview/115097 | Jun–Aug 2026 |
| https://forum.obsidian.md/t/plugin-review-question/110295 ; …/obsidian-unofficial-plugins-catalog/110239 ; …/how-what-retriggers-plugin-re-evaluation/75930 | Jan 2024–Feb 2026 (legacy process) |
| https://forum.obsidian.md/t/package-for-end-to-end-testing-obsidian-plugins/98645 ; …/e2e-testing-of-plugins-with-webdriverio/107493 ; …/is-there-an-e2e-test-suite-we-can-run-to-verify-a-plugin-doesnt-break-obsidian-core-functionality/116864 | 2025–2026 |
| https://forum.obsidian.md/t/using-github-actions-to-release-plugins/7877 ; …/plugin-release-for-developers-hot-reload-the-plugin-s-youre-developing/12185 ; …/plugin-development-console-log-message-not-appearing/80836 | 2020–2026 |

### Community: 2026 review notices (GitHub issues)

https://github.com/learnerchen-forever/wewrite/issues/27 ; https://github.com/tgrosinger/test-plugin/issues/1 ; https://github.com/ebullient/obsidian-admonition/issues/434 ; https://github.com/artisticat1/obsidian-latex-suite/issues/624 ; https://github.com/alberti42/obsidian-plugins-annotations/issues/27 ; https://github.com/alexgavrusev/obsidian-format-with-prettier/issues/80 ; https://github.com/hydrateagent/hydrate/issues/1 ; https://github.com/SystemSculpt/obsidian-systemsculpt-ai/issues/334 ; https://github.com/jonaas-dev/obsidian-margin-comments/issues/39 ; https://github.com/al0cam/AutoMover/issues/19 ; https://github.com/farling42/obsidian-import-json/issues/92 (all 27 Aug–8 Oct 2026).

### Other

https://endoflife.date/nodejs ; https://typescript-eslint.io/rules/no-deprecated/ ; https://typescript-eslint.io/users/dependency-versions/ ; https://github.com/gund/eslint-plugin-deprecation (archived 16 Oct 2024) ; https://docs.npmjs.com/cli/v11/commands/npm-version ; https://docs.npmjs.com/cli/v11/commands/npm-audit ; https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates ; https://esbuild.github.io/api/ ; https://cli.github.com/manual/gh_release_view ; npm registry metadata for `obsidian`, `eslint-plugin-obsidianmd`, `wdio-obsidian-service`, `obsidian-dev-utils`, `esbuild` 0.28.2, `typescript` 7.0.2, `eslint` 10.12.0, `typescript-eslint` 8.71.1, `vitest` 5.0.3, `jest` 30.5.2.
