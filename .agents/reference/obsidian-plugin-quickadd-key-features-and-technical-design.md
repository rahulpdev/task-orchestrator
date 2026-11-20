# QuickAdd: key features and technical design

**Verification (5 October 2026).** QuickAdd **2.30.0** was the latest published stable release when checked. Its [manifest][R2] names plugin ID `quickadd`, author Christian B. B. Houmann, and minimum Obsidian version **1.13.0**; it is not desktop-only. Sources are the [official documentation][D1], [repository][R0], [release][R1], and tagged code. Documentation pages may change because the site has one live version. This review did not run the plugin in a live vault. [D0] [R1]

QuickAdd is an Obsidian community plugin that turns repeated note work into named **choices**. A choice can create a note, capture text or a property, run a sequence, or open a group of choices. This reference links each visible setting to the saved configuration and the resulting file or runtime effect, so later decisions can distinguish QuickAdd's behavior from the Markdown it leaves behind. [D1] [S1]

**Evidence key.** **Documented** means official documentation states the behavior. **Source verified** means tagged 2.30.0 code confirms it. **Inconclusive** means the evidence does not establish an outcome. `D` and `O` links are official docs; `S` and `R` links are source and release records.

## Key features and functionality

**Template choice.** Set a template file, note name, destination folder, and optional link or opening behavior. QuickAdd fills placeholders, then creates a file matching the `.md`, `.canvas`, or `.base` template type. If that file exists, a saved rule decides whether to reuse, update, overwrite, or rename the result. Markdown updates merge frontmatter (properties between `---` lines); Canvas and Base allow overwrite but not text append. **Documented; source verified. Version 2.30.0.** [D2] [S2]

**Capture choice.** Set a target such as `Journal/{{DATE}}.md`, a format such as `- {{TIME}} {{VALUE}}`, and a write position. QuickAdd asks for missing values, then writes at the chosen position or updates a property. It can create a missing note from a template, turn entries into `- [ ]` tasks, or repeat the format for each input line. One Capture writes to one target per run; a Macro can run several Captures. **Documented; source verified. Version 2.30.0.** [D3] [S3]

**Target pickers.** `Capture to` can point to the active note, a path, a folder, `#tag`, or `property:type=draft`. A blank target opens a picker for all Markdown notes. Filters such as `folder:Goals|exclude-folder:Archive|tag:active` narrow the list; repeated folders mean OR, while repeated tags mean AND. Property filters read frontmatter, not inline `field:: value` text. Creating a note from a filtered picker does not add the filter's tag or property. **Documented. Version 2.30.0.** [D3]

**Canvas capture.** A Capture can target one selected card in Canvas, or a named card in a specified `.canvas` file. It edits text cards directly and Markdown files linked by file cards; the saved settings can hold `captureToCanvasNodeId`. Top, bottom, before-line, and after-line placement work. Cursor placement, unsupported cards, or multiple selections stop the Capture. Template choices can also create Canvas files. **Documented; source verified. Version 2.30.0.** [D3] [S3]

**Property capture.** Choose **Write position → Property**, a fixed or prompted key, and **Set value** or **Add to list**. QuickAdd checks the value's type before using Obsidian's frontmatter writer. It keeps numbers and checkboxes typed, and skips exact duplicates added to lists. `{{PROPERTY}}` reads the old value; scripts can read `propertyValue`, `propertyKey`, and `list`. Adding to a single-value property fails, and Obsidian may reformat the YAML. **Documented; source verified. Version 2.30.0.** [D3] [D4] [S19]

**Macro choice.** A Macro chains steps in a saved order. Its builder offers **Obsidian Command**, **Editor commands**, **User Script**, **Nested Choice**, **Wait**, **AI Assistant** (artificial intelligence), **Open File**, and **Conditional**. Steps share temporary values, and a condition runs its Then or Else branch before continuing. Obsidian commands run by registered ID; some need a Wait because their later screen work is not awaited. A Macro changes vault files only when one of its steps does so. **Documented; source verified. Version 2.30.0.** [D5] [S4]

**Multi choice.** A Multi groups other choices in a named menu. It can have a search hint and icon. Browsing opens one level at a time, while search can find choices deeper inside. Its saved data contains those child choices. Opening the menu alone changes no note. **Documented; source verified. Version 2.30.0.** [D6] [S1]

**Existing notes.** **QuickAdd: Apply template to active note** also appears in a Markdown file's context menu. It can insert at the cursor or top, append at the bottom, or replace the note. Insert and append merge frontmatter: existing single values win, while new list values are added. A Template choice can also search for an existing note, then open or update it. These updates need Markdown files; the standalone command may offer to move or rename the note. **Documented. Version 2.30.0.** [D7] [D2]

**Links and views.** Template and Capture can insert a link in the current note or append one to another existing Markdown note. They can also copy a vault-path wikilink to the clipboard. Current-note links can replace or follow a selection, start a new line, or enter a property; body links can embed the result. Opening controls choose the tab or pane, view mode, and focus. `{{CURSOR}}` needs a focused editing view; copying or opening alone changes no note. **Documented; source verified. Version 2.30.0.** [D2] [D3] [S5]

**Input controls.** Questions normally appear one at a time. An optional one-page form collects predictable Template, Capture, and Macro inputs before the action runs. It supports text, numbers, dates, selections, `{{FIELD:...}}`, and `{{FILE:...}}`; each choice can override the global form setting. Scripts, conditions, AI steps, and nested Macros can change later questions, so the form stops before them. Cancelling stops the run; if input scanning fails, QuickAdd uses ordinary prompts. **Documented; source verified. Version 2.30.0.** [D8] [S6]

**AI Assistant.** After enabling online features, a Macro can send a formatted Markdown prompt to an AI model. It saves the reply in a temporary variable and also provides a quote-block version under `<name>-quoted`. Scripts can use AI tools and request data in a fixed shape; supported request types include OpenAI-compatible, Gemini, and Anthropic. Prompt templates can run code before sending, while the system prompt is sent exactly as written. The reply changes no note until another step writes it, and provider keys use Obsidian SecretStorage. **Documented; source verified. Version 2.30.0.** [D9] [D10] [S7]

**External triggers.** Run choices from QuickAdd's menu, ribbon, command palette, or a hotkey. An Obsidian URI (an app-opening link) such as `obsidian://quickadd?choice=...&value-name=...` runs by exact name and passes named values. Optional callbacks report Template or Capture results, but not Macro or Multi results. The CLI (terminal interface) can run, list, and check choices, create from a template, or manage packages. An unattended CLI run reports missing inputs instead of waiting for a screen prompt. **Documented; source verified. Version 2.30.0.** [D11] [D12] [S8]

**Portable packages.** Export selected choices, their dependencies, and available files as `.quickadd.json`, a structured text file. Import first shows the code and possible file overwrites for review. The package records its format version, QuickAdd version, choice IDs, parent paths, and files encoded as text. Import can add, replace, duplicate, or skip choices; files can be written, overwritten, or skipped. Dynamic template paths and secrets stay outside; unbundled scripts use files at their referenced paths. **Documented; source verified. Version 2.30.0.** [D13] [D2] [S9]

## Configuration and action model

**Saved units.** **Source verified:** every choice has an `id` (generated identifier), `name`, `type`, and `command` flag. It can also store a date rule, input-form override, and icon. `type` is `Template`, `Capture`, `Macro`, or `Multi`. A Macro holds ordered `macro.commands`; a Multi holds child `choices`. Template and Capture hold paths, write rules, links, and opening options. Obsidian saves this tree and global settings through `loadData`/`saveData`. The default file is `.obsidian/plugins/quickadd/data.json`, but a vault can use another config folder. [S1] [S10] [O1]

| User configuration | Saved representation | Execution and lasting result |
| --- | --- | --- |
| Template path `Templates/Book.md`, file name `{{VALUE:title}}`, folder `Books` | `Template` choice with `templatePath`, `fileNameFormat`, `folder`, and collision settings | Prompts for `title`, formats the template, then creates or updates `Books/<title>.md`. [D2] [S2] |
| Capture to `Journal/{{DATE}}.md`, format `- {{TIME}} {{VALUE}}` | `Capture` choice with `captureTo`, `format`, placement, and create-file settings | Resolves the dated target and inserts a Markdown line; if configured, creates the note first. [D3] [S3] |
| Property Capture of `tags`, action **Add to list** | `propertyCapture: { property: { kind: "named", format: "tags" }, action: "addToList", createIfMissing: ... }` | Validates and updates the target note's YAML list through Obsidian's frontmatter writer. [D3] [S3] |
| Macro with script, Conditional, then Capture | `Macro` choice with ordered `macro.commands`; Conditional has `thenCommands` and `elseCommands` | Shares run variables, takes one branch, then calls the Capture; only steps that write change vault content. [D5] [S4] |
| Multi containing the above choices | `Multi` choice with recursive `choices` | Opens a menu; choosing a child starts that child's action. The menu itself changes no note. [D6] [S1] |

**Execution path.** **Source verified:** `ChoiceExecutor.execute` starts a choice run. It sets the date, temporary values, and optional advance input form, then dispatches by choice type. A Macro follows its command list in order and waits for QuickAdd's own scripts, child choices, AI steps, file openings, and waits. Saved `Choice` commands refer to another choice by `choiceId`; `NestedChoice` commands carry a choice object. Both use the choice executor. An Obsidian Command calls `executeCommandById` without waiting for later screen work. QuickAdd remembers the original active note so nested steps can still refer to it. [S4] [S6]

**Run variables.** **Documented; source verified:** `{{VALUE:project}}` asks once and stores `project` for this run. Later Macro steps and `params.variables.project` read that answer. Bare `{{VALUE}}` uses a separate `value` key; even an empty string counts as an answer. `{{GLOBAL_VAR:Name}}` reads a saved settings snippet, while `{{MACRO:Name}}` inserts a Macro result. `quickAddApi.executeChoice(name, variables)` starts a separate choice and returns `undefined`. It clears temporary variables afterward, so callers should not expect a returned result. [D14] [D15] [S4] [S11]

**Format pipeline.** **Documented; source verified:** QuickAdd first expands inline `js quickadd` code, macros, included templates, and saved snippets. It then fills dates, prompts, selections, clipboard text, and vault values. Key tokens include `{{DATE}}`, `{{TIME}}`, `{{VDATE:due,YYYY-MM-DD}}`, `{{FILE:People}}`, `{{FIELD:status}}`, and `{{SELECTED}}`. Others include `{{CLIPBOARD}}`, `{{LINKCURRENT}}`, `{{TITLE}}`, `{{FOLDER}}`, and `{{RANDOM:6}}`. Typed answers are protected: typing `{{DATE}}` as an answer leaves those characters unchanged. `{{DAILY}}` follows Daily notes or Periodic Notes settings; other periodic tokens need Periodic Notes. Because code can run during formatting, reading a template can do more than copy its text. [D16] [D17] [S12]

**File flow.** **Documented; source verified:** a Template resolves its source, folder, and name before reading and filling the template. It checks the saved rule for existing files, then creates or updates the target. A Capture resolves a target and position, formats its content, and writes through Obsidian's editor or vault functions. Links, clipboard copying, and opening happen after the write. New-file paths are checked to prevent writes outside the vault. The resulting Markdown, Canvas, or Base file remains without QuickAdd; the saved action still needs the plugin. [D2] [D3] [S2] [S3] [S13]

## Technical design and conventions

**Frontmatter rules.** Frontmatter is note-property text, written in YAML between `---` lines. **Documented; source verified:** inserting or appending a Template merges properties instead of stacking two blocks. A Capture that inserts template text into the body does not merge it, so a second block can appear. Property Capture validates values before using `app.fileManager.processFrontMatter`. Script arrays (lists) and objects (named groups) become real property values. An optional beta setting guesses types from strings; it starts off. [D3] [D7] [D18] [S3] [S14]

**Script boundary.** **Documented; source verified:** a Macro User Script lives in a visible vault `.js` file or a plain `js`/`javascript` code block in a note. QuickAdd runs the note's first matching block. The script exports a CommonJS function or object (a JavaScript module). It receives `params.app`, `params.obsidian`, `params.quickAddApi`, `params.variables`, and `params.abort`; `::member` selects an export. By contrast, a template's `js quickadd` block returns text or a value during formatting, before the new note exists. Both can use Obsidian's API, the functions it gives plugins, and can act beyond QuickAdd's built-in file steps. [D5] [D19] [D20] [S4] [S15]

**Obsidian mechanisms.** **Source verified:** Obsidian vault functions create, read, and change files. QuickAdd also updates the open editor directly when needed to protect unsaved typing. `metadataCache`, Obsidian's note index, supplies properties, tags, headings, and links for pickers. `{{FIELD:...}}` suggestions use a memory cache: at most 100 entries, expiring after five minutes. Obsidian metadata changes and vault renames clear that cache. Command registration adds palette entries; `registerObsidianProtocolHandler("quickadd", ...)` handles app links. These helpers do not form another saved notes database. [S3] [S5] [S8] [S16] [S17] [O1]

**Settings and secrets.** **Source verified:** `data.json` holds choices, template folders, global snippets, input options, AI settings, and update records. Writes are queued and compare the last saved, current, and on-disk values. A small race remains because Obsidian offers no save that checks whether the file changed at the same instant. AI and script secrets use Obsidian SecretStorage, separate from `data.json`. Draft prompts last for one session; field suggestions stay in memory. AI request logs also stay in memory and keep up to 25 prompts with model, status, and usage details, but no response text. SecretStorage is local to the device and vault, so synced settings carry secret references rather than secret values. [D10] [D19] [S10] [S16] [S20] [S21] [O2]

**Failure boundary.** **Documented; source verified:** cancelling a prompt, calling `params.abort()`, or leaving a script error uncaught stops later Macro steps. Missing Obsidian commands and unknown saved command types are reported and skipped, so a Macro may continue with a partial result. Template and Capture record whether a target was created, changed, or unchanged. Capture records a successful write before later link or opening work, so a later error does not invite a duplicate retry. **Inference:** completed file writes appear to remain if a later Macro step fails; no all-step rollback was found. [D5] [D12] [S3] [S4] [S18]

## Limits, discrepancies, and open points

- **Version wording.** The CLI guide says Obsidian added plugin CLI handlers in 1.12.2. QuickAdd 2.30.0's manifest sets `minAppVersion` to **1.13.0**. The first is an API milestone; the second is this release's install minimum. **Documented/source discrepancy.** [D12] [R2]
- **Path formatting.** Dynamic template-source paths do not run `{{MACRO:...}}`, inline JavaScript, or `{{TEMPLATE:...}}` includes. `{{TITLE}}` is also unavailable there. Capture targets `.md` or `.canvas`, not `.base`; property Capture needs Markdown. **Documented.** [D2] [D3]
- **Token context.** `{{PROPERTY}}` outside a property Capture stops with an error, and an unknown `{{GLOBAL_VAR:Name}}` becomes empty text. `{{CURSOR}}` only moves an editable, focused destination view. **Documented.** [D4] [D15] [D2]
- **Integrations.** Daily notes and optional Periodic Notes supply dated paths. Optional Templater can process `<% %>` in QuickAdd output; the whole-file Capture rerun switch is deprecated. Scripts and commands can call other plugins, whose behavior depends on their installation. A new note does not automatically receive a QuickAdd template because of its folder. **Documented.** [D17] [D21] [D5]
- **External runs.** App-link calls can race vault sync before another device's new note arrives. Callback links may behave differently across devices. Terminal support needs Obsidian's plugin CLI handlers. A run needing an unanswered prompt may not finish unattended. **Documented.** [D11] [D12]
- **Unverified runtime.** This review did not test a live vault, mobile device, AI provider, sync service, or other plugin. Exact YAML formatting, device-specific clipboard behavior, and every plugin combination remain **inconclusive** beyond the cited docs and code.

## Source map

The documentation links are official live pages. The source links are pinned to Git tag `2.30.0` so the implementation evidence does not drift.

[D0]: https://quickadd.obsidian.guide/
[D1]: https://quickadd.obsidian.guide/docs/
[D2]: https://quickadd.obsidian.guide/docs/Choices/TemplateChoice/
[D3]: https://quickadd.obsidian.guide/docs/Choices/CaptureChoice/
[D4]: https://quickadd.obsidian.guide/docs/InlineScripts/#property-capture-variables
[D5]: https://quickadd.obsidian.guide/docs/Choices/MacroChoice/
[D6]: https://quickadd.obsidian.guide/docs/Choices/MultiChoice/
[D7]: https://quickadd.obsidian.guide/docs/ApplyTemplateToNote/
[D8]: https://quickadd.obsidian.guide/docs/Advanced/onePageInputs/
[D9]: https://quickadd.obsidian.guide/docs/AIAssistant/
[D10]: https://quickadd.obsidian.guide/docs/Settings/
[D11]: https://quickadd.obsidian.guide/docs/Advanced/ObsidianUri/
[D12]: https://quickadd.obsidian.guide/docs/Advanced/CLI/
[D13]: https://quickadd.obsidian.guide/docs/Choices/Packages/
[D14]: https://quickadd.obsidian.guide/docs/VariablesDataFlow/
[D15]: https://quickadd.obsidian.guide/docs/GlobalVariables/
[D16]: https://quickadd.obsidian.guide/docs/FormatSyntax/
[D17]: https://quickadd.obsidian.guide/docs/FormatSyntax/#daily
[D18]: https://quickadd.obsidian.guide/docs/TemplatePropertyTypes/
[D19]: https://quickadd.obsidian.guide/docs/UserScripts/
[D20]: https://quickadd.obsidian.guide/docs/InlineScripts/
[D21]: https://quickadd.obsidian.guide/docs/ComingFromTemplater/
[R0]: https://github.com/chhoumann/quickadd
[R1]: https://github.com/chhoumann/quickadd/releases/tag/2.30.0
[R2]: https://github.com/chhoumann/quickadd/blob/2.30.0/manifest.json
[S1]: https://github.com/chhoumann/quickadd/tree/2.30.0/src/types/choices
[S2]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/engine/TemplateChoiceEngine.ts#L58
[S3]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/engine/CaptureChoiceEngine.ts#L472
[S4]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/engine/MacroChoiceEngine.ts#L255
[S5]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/engine/choiceFileActions.ts
[S6]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/choiceExecutor.ts#L139
[S7]: https://github.com/chhoumann/quickadd/tree/2.30.0/src/ai
[S8]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/main.ts#L120
[S9]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/types/packages/QuickAddPackage.ts
[S10]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/settings.ts
[S11]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/quickAddApi.ts
[S12]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/formatters/completeFormatter.ts#L90
[S13]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/engine/QuickAddEngine.ts#L65
[S14]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/engine/helpers/frontmatterPostProcessor.ts
[S15]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/engine/userScriptExecution.ts#L49
[S16]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/utils/FieldSuggestionCache.ts#L9
[S17]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/uri/registerQuickAddUri.ts#L23
[S18]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/engine/choiceOutcomeRecorder.ts
[S19]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/engine/CaptureChoiceEngine.ts#L740
[S20]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/main.ts#L320
[S21]: https://github.com/chhoumann/quickadd/blob/2.30.0/src/ai/requestLog.ts#L3
[O1]: https://docs.obsidian.md/Reference/TypeScript%2BAPI/App/vault
[O2]: https://docs.obsidian.md/plugins/guides/secret-storage
