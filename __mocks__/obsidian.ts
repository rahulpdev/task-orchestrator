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

	/**
	 * Keeps the application object, as Obsidian's constructor does.
	 *
	 * @param app - The application object.
	 */
	constructor(app: unknown = {}) {
		this.app = app;
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

/** Stand-in for a file in the vault. */
export class TFile {
	/** Vault-relative path, such as `Folder/Note.md`. */
	path = '';
}

/** Stand-in for a folder in the vault. */
export class TFolder {
	/** Vault-relative path of the folder. */
	path = '';
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
