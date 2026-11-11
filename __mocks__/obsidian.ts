/**
 * Hand-written stand-in for the `obsidian` module, used only by the plugin's unit tests.
 *
 * The real `obsidian` package holds type definitions only, so tests alias the import to this file.
 * It reflects assumptions about the API; the real-Obsidian tests prove the integration.
 *
 * @packageDocumentation
 */

/** Every message passed to {@link Notice}, oldest first. Tests reset it with `length = 0`. */
export const shownNotices: string[] = [];

/** Stand-in for Obsidian's plugin base class. */
export class Plugin {
	/** The application object the plugin was created with. */
	readonly app: unknown;

	/**
	 * Keeps the application object, as Obsidian's constructor does.
	 *
	 * @param app - The application object.
	 */
	constructor(app: unknown = {}) {
		this.app = app;
	}
}

/** Stand-in for Obsidian's modal dialog. */
export class Modal {
	/** Whether {@link Modal.open} has been called more recently than {@link Modal.close}. */
	isOpen = false;

	/** Marks the modal as open. */
	open(): void {
		this.isOpen = true;
	}

	/** Marks the modal as closed. */
	close(): void {
		this.isOpen = false;
	}
}

/** Stand-in for Obsidian's settings tab base class. */
export class PluginSettingTab {
	/** The application object the tab was created with. */
	readonly app: unknown;
	/** The plugin that owns the tab. */
	readonly plugin: unknown;
	/** How many times {@link PluginSettingTab.update} has been called. */
	updateCount = 0;

	/**
	 * Keeps the application object and plugin, as Obsidian's constructor does.
	 *
	 * @param app - The application object.
	 * @param plugin - The plugin that owns the tab.
	 */
	constructor(app: unknown = {}, plugin: unknown = {}) {
		this.app = app;
		this.plugin = plugin;
	}

	/** Records that the tab asked to be redrawn. */
	update(): void {
		this.updateCount += 1;
	}
}

/** Stand-in for one row in a settings tab. */
export class Setting {
	/** The name most recently passed to {@link Setting.setName}. */
	settingName = '';

	/**
	 * Records the row's name.
	 *
	 * @param settingName - The name to show.
	 * @returns This row, so calls can be chained.
	 */
	setName(settingName: string): this {
		this.settingName = settingName;
		return this;
	}
}

/** Stand-in for a folder in the vault. */
export class TFolder {
	/** Vault-relative path of the folder; `''` for the vault root. */
	path = '';
}

/** Stand-in for a file in the vault. */
export class TFile {
	/** Vault-relative path, such as `Folder/Note.md`. */
	path = '';
	/** The folder that holds the file, or `null` for none. */
	parent: TFolder | null = null;
}

/** Stand-in for the Markdown editor view. */
export class MarkdownView {
	/** The file shown in the view, or `null` when none is open. */
	file: TFile | null = null;
}

/** Stand-in for Obsidian's pop-up notice; records each message in {@link shownNotices}. */
export class Notice {
	/** The text the notice would show. */
	readonly noticeMessage: string;

	/**
	 * Records the message instead of showing it.
	 *
	 * @param noticeMessage - The text the notice would show.
	 */
	constructor(noticeMessage: string) {
		this.noticeMessage = noticeMessage;
		shownNotices.push(noticeMessage);
	}
}

/** Platform flags for a desktop app, the only platform the plugin supports. */
export const Platform = {
	isDesktop: true,
	isDesktopApp: true,
	isMobile: false,
	isMobileApp: false,
} as const;

/**
 * Cleans a vault path the way Obsidian's `normalizePath` does for the cases the tests use.
 *
 * @param pathText - A path that may use backslashes, repeated slashes or edge slashes.
 * @returns The path with forward slashes, no repeats and no leading or trailing slash.
 */
export function normalizePath(pathText: string): string {
	return pathText
		.replace(/\\/g, '/')
		.replace(/\/+/g, '/')
		.replace(/^\/+|\/+$/g, '');
}

/** Stand-in for the result of {@link getFrontMatterInfo}. */
export interface FrontMatterInfo {
	readonly exists: boolean;
	readonly frontmatter: string;
	readonly from: number;
	readonly to: number;
	readonly contentStart: number;
}

/**
 * Finds the front matter block the way Obsidian's `getFrontMatterInfo` does for the cases the
 * tests use: a first line `---` and a later line `---`.
 *
 * @param content - The whole note.
 * @returns Where the front matter is and where the body starts.
 */
export function getFrontMatterInfo(content: string): FrontMatterInfo {
	const noBlock = { exists: false, frontmatter: '', from: 0, to: 0, contentStart: 0 };
	if (!content.startsWith('---\n')) {
		return noBlock;
	}
	const closingIndex = content.indexOf('\n---', 3);
	if (closingIndex === -1) {
		return noBlock;
	}
	const afterFence = closingIndex + 4;
	const contentStart = content[afterFence] === '\n' ? afterFence + 1 : afterFence;
	return {
		exists: true,
		frontmatter: content.slice(4, closingIndex + 1),
		from: 4,
		to: closingIndex + 1,
		contentStart,
	};
}
