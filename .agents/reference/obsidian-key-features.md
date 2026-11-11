# Obsidian: key capabilities beyond Markdown files

Verified 3 October 2026 against the [official Obsidian documentation](https://obsidian.md/help/) and [changelog](https://obsidian.md/changelog/). Latest public releases checked: **Desktop 1.13.7** and **Mobile 1.13.8**; latest Catalyst (early-access) releases: **Desktop and Mobile 1.14.4**. The entries below describe public-release functionality only. Version markers mean *verified against* that release, not *first introduced in* it.

Given Markdown files, folders, YAML properties (labelled details at the top of a note), and simple scripts, Obsidian adds a connected interface over those files. It tracks relationships, turns properties into views, supports visual exploration and capture, and offers optional sharing and syncing services. A *vault* is Obsidian's folder of files; a *core plugin* is an optional feature included with the app. This inventory describes capabilities, not a suggested setup.

## Connections and discovery

**Linked notes.** Obsidian suggests files while you create links to notes, headings, or individual blocks of text. It can update internal links when you rename a file, so the relationships remain usable as notes move. Links can point to notes that have not yet been created. [Source](https://obsidian.md/help/links). (Obsidian v1.13.7)

**Backlinks and mentions.** The Backlinks core plugin shows which notes link *to* the current note, reversing the direction of each link. It also finds unlinked mentions of the note's name, revealing possible connections that are absent from the written links. You can see the text around each mention for context. [Source](https://obsidian.md/help/plugins/backlinks). (Obsidian v1.13.7)

**Live embeds.** You can display another note, heading, block, image, audio file, or PDF inside a note. Embedded note content stays current when its source changes, allowing one piece of content to appear in several contexts without copying it. A heading or block embed can show just the relevant part of a longer note. [Source](https://obsidian.md/help/embeds). (Obsidian v1.13.7)

**Structured search.** The Search core plugin can combine words with filters for filenames, paths, tags, properties, and unfinished tasks. Results can target lines, blocks, or sections, which is more precise than opening files one by one. Searches can combine required, optional, and excluded terms. [Source](https://obsidian.md/help/plugins/search). (Obsidian v1.13.7)

**Relationship graph.** The Graph view core plugin draws notes and their links as connected points, with a local view for the current note's neighbourhood. You can filter what appears and follow connections directly from the graph. The local graph can show links several steps away. [Source](https://obsidian.md/help/plugins/graph). (Obsidian v1.13.7)

## Structured information

**Bases views.** The Bases core plugin turns note properties into collections that you can filter, sort, group, and edit. One collection can have multiple table, list, or card views; the underlying information remains in local Markdown files. Each view can apply its own filters to show a different selection of notes. [Sources](https://obsidian.md/help/bases), [view versions](https://obsidian.md/help/bases/views). (Obsidian v1.13.7)

**Calculated properties.** Bases formulas calculate values from note properties or file information, such as dates, numbers, and text. You can display the results in views or use them to filter and sort notes. Table views can also summarize visible values with counts or totals. [Sources](https://obsidian.md/help/formulas), [table summaries](https://obsidian.md/help/bases/views/table). (Obsidian v1.13.7)

**Property overview.** Obsidian gives properties types such as date, number, checkbox, and list. The Properties view core plugin lists the properties used across the vault. It can show how often a property is used, open a search for it, or rename it across notes. [Sources](https://obsidian.md/help/properties), [Properties view](https://obsidian.md/help/plugins/properties). (Obsidian v1.13.7)

## Visual work and editing

**Canvas boards.** The Canvas core plugin offers an open two-dimensional board for arranging notes, media, web pages, and text cards. You can connect and group them to explore an idea spatially. Boards are saved separately as `.canvas` files. [Source](https://obsidian.md/help/plugins/canvas). (Obsidian v1.13.7)

**Live preview.** Obsidian can show formatted text while you edit, revealing Markdown marks where your cursor is. A separate reading view hides the editing marks. It can also display diagrams and callouts (highlighted blocks of text), so notes can be reviewed as richer documents within the same app. [Sources](https://obsidian.md/help/edit-and-read), [advanced formatting](https://obsidian.md/help/advanced-syntax), [callouts](https://obsidian.md/help/callouts). (Obsidian v1.13.7)

**Saved workspaces.** The Workspaces core plugin saves sets of open files, tabs, and sidebar layout, then switches between them. This makes a reading or writing context recoverable without changing the files themselves. You can keep separate layouts for different kinds of work. [Source](https://obsidian.md/help/plugins/workspaces). (Obsidian v1.13.7)

## Capture and automation

**Templates and dates.** The Templates core plugin inserts reusable content with the current note title, date, or time. Daily notes can create or open the note for today's date. A new daily note can use a template, combining capture with a repeatable structure. [Sources](https://obsidian.md/help/plugins/templates), [daily notes](https://obsidian.md/help/plugins/daily-notes). (Obsidian v1.13.7)

**Web clipping.** Obsidian's official Web Clipper browser extension saves selected web content and highlights to the vault. Its templates can extract page details into note content or properties, reducing manual copying from a browser. Templates can also choose a format based on the website. [Sources](https://obsidian.md/help/web-clipper), [clipper templates](https://obsidian.md/help/web-clipper/templates). (Obsidian v1.13.7)

**App automation.** Obsidian's command-line interface (CLI) can search, return results from a Base, or create a note from a template. It requires a compatible desktop installer. Obsidian links (`obsidian://`) let other apps open or create notes and launch searches. Together, these let scripts and other apps ask Obsidian to act instead of only editing files. [Sources](https://obsidian.md/help/cli), [Obsidian URI](https://obsidian.md/help/uri). (Obsidian v1.13.7)

**Plugin platform.** Obsidian gives developers a way to add commands, views, and other app behaviour. These additions can work with notes through Obsidian rather than only reading their files. The specific functions of community plugins are outside this inventory. [Sources](https://obsidian.md/help/plugins), [developer documentation](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin). (Obsidian v1.13.7)

## App automation — expanded

An outside program can read or change a vault's files directly, as a simple script already can. It can also ask Obsidian to carry out a supported action through the CLI or an `obsidian://` link. That lets the program use Obsidian features such as search, links, templates, and open views when a documented action provides access to them. [Sources: CLI](https://obsidian.md/help/cli), [Obsidian URI](https://obsidian.md/help/uri).

The **CLI** accepts text commands from a terminal or another program. For example, `obsidian search query="meeting notes"` asks Obsidian to search the vault. `obsidian base:query file=Projects.base` asks it to return results from an existing Base. Other commands can list backlinks, read or change properties, create a note from a template, or run a named Obsidian command. The CLI can return results in a form another program can read; a rename can also update internal links if that setting is on. It needs an Obsidian desktop installer version of at least 1.12.7. After you turn it on in settings, Obsidian registers the command so the terminal can find it. Commands go to the running app; the first command starts it if necessary. [Source](https://obsidian.md/help/cli).

An **Obsidian URI** is a specially formatted, web-style link that another app can open to ask Obsidian to act. For example, `obsidian://search?vault=Notes&query=meeting` opens Search in the `Notes` vault with `meeting` as the search text. Documented links can also open a vault or note, create or add to a note, open or create a daily note, or show the vault chooser. A link can carry details such as a vault name, note path, content, or search words. Special characters need codes in the link: for example, a space becomes `%20`. Daily-note and unique-note links need their matching core plugins. The computer must also know to open `obsidian://` links in Obsidian: running the app once normally handles this on macOS and Windows, while Linux needs more setup. [Source](https://obsidian.md/help/uri).

Both mechanisms can open a note, make a note, or start a search. The CLI has a wider documented set of actions and can return information, such as Base results or backlinks, to the caller. A URI starts one of its supported actions by opening a link; it does not generally return search results. Some URI actions can send limited file details, such as a name and link, back to another app. An action available in Obsidian's interface does not by itself mean there is a matching URI action. [Sources: CLI](https://obsidian.md/help/cli), [Obsidian URI](https://obsidian.md/help/uri).

The extra value over direct file editing depends on the action. A script can rename `Project.md` on disk, but a CLI rename can also update links to it when automatic link updating is on. A script can read YAML itself, while a CLI Base query asks Obsidian to apply a saved view and return its results. A URI can bring a person straight to a note or search in the app. These options use Obsidian's handling of the files and its open interface; they are not always preferable to editing files directly. The example names `Notes` and `Projects.base` assume that vault and Base file exist. This section describes documented public-release behaviour, not hands-on tests across every operating system or command. [Sources: CLI](https://obsidian.md/help/cli), [Obsidian URI](https://obsidian.md/help/uri). (Obsidian Desktop v1.13.7)

## Recovery, devices, and publishing

**Local recovery.** The File recovery core plugin regularly saves copies of `.md` and `.canvas` files on your device. It can restore an earlier copy after an unwanted change or deletion. Those copies expire and remain on that device, so this is not a complete backup system. [Source](https://obsidian.md/help/plugins/file-recovery). (Obsidian v1.13.7)

**Device sync.** Obsidian Sync is a paid add-on that synchronizes notes across devices, with choices about which files and settings to sync. It includes version history for restoring synced files and supports shared vaults. End-to-end encryption, which keeps Obsidian from reading the synced content, is the default option for a new remote vault. [Sources](https://obsidian.md/help/sync), [version history](https://obsidian.md/help/sync/version-history), [security](https://obsidian.md/help/sync/security). (Obsidian v1.13.7)

**Mobile access.** Obsidian's iOS, iPadOS, and Android apps provide the note interface on a phone or tablet. They include a mobile toolbar and shortcuts for finding or creating notes. Device sync is a separate choice; the mobile app alone does not imply that files move between devices. [Sources](https://obsidian.md/help/mobile), [syncing options](https://obsidian.md/help/sync-notes). (Obsidian Mobile v1.13.8)

**Web publishing.** Obsidian Publish is a paid hosting add-on that turns selected notes into a public website, wiki, or documentation site. The hosted site can expose navigation, a graph, and full-text search. Readers get a usable site without a separate publishing build. [Sources](https://obsidian.md/help/publish), [service features](https://obsidian.md/pricing). (Obsidian v1.13.7)

*Limits of this reference:* It is based on official documentation and release notes rather than hands-on tests of every feature. Current documentation also describes Catalyst-only features; in particular, Bases Kanban is documented for 1.14 and is excluded here. [Source](https://obsidian.md/help/bases/views/kanban).
