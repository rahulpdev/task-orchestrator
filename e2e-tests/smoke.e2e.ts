/**
 * Smoke tests inside a real Obsidian, at the minimum supported version and the latest one.
 * The plugin is desktop-only, so mobile emulation is not tested.
 */
import { $, $$, browser, expect } from '@wdio/globals';
import { beforeEach, describe, it } from 'mocha';
import { obsidianPage } from 'wdio-obsidian-service';
import { messagesFor } from '../packages/core/src/core/messages/index.ts';

const PLUGIN_ID = 'task-orchestrator';
const FIXTURE_NOTE_ID = '6f1c2d9e-3b7a-4c1e-9f0a-2b8d4e6a1c33';
const FIXTURE_NOTE_PATH = 'Fixture note.md';
const BRITISH = messagesFor('en-GB');
const RECORDED_ERRORS_KEY = 'taskOrchestratorRecordedErrors';

/** Obsidian's settings window. Internal and undocumented: used by these tests only. */
interface InternalSettingModal {
	open(): void;
	openTabById(tabId: string): unknown;
	close(): void;
}

/** Internal, undocumented parts of the app object, typed for these tests only. */
interface InternalAppView {
	readonly vault: unknown;
	readonly plugins?: { readonly enabledPlugins?: Set<string> };
	readonly setting?: InternalSettingModal;
}

async function removeShownNotices(): Promise<void> {
	await browser.executeObsidian(() => {
		activeDocument.querySelectorAll('.notice').forEach((noticeElement) => {
			noticeElement.detach();
		});
	});
}

async function countNoticesWithText(noticeText: string): Promise<number> {
	const texts = await $$('.notice').map((notice) => notice.getText());
	return texts.filter((text) => text.includes(noticeText)).length;
}

async function setLanguage(language: 'en-GB' | 'en-US'): Promise<boolean> {
	return browser.executeObsidian(async ({ plugins }, chosenLanguage) => {
		const result = await plugins.taskOrchestrator.core.execute({
			name: 'updateSettings',
			version: 1,
			actor: 'user',
			payload: { language: chosenLanguage },
		});
		return result.ok;
	}, language);
}

describe('Personal Task Orchestrator in a real Obsidian', function () {
	beforeEach(async function () {
		await obsidianPage.resetVault();
		await removeShownNotices();
	});

	it('is enabled', async function () {
		const isLoaded = await browser.executeObsidian(({ app }, pluginId) => {
			const pluginsView: InternalAppView = app;
			return pluginsView.plugins?.enabledPlugins?.has(pluginId) ?? false;
		}, PLUGIN_ID);
		expect(isLoaded).toBe(true);
	});

	it('shows the success notice when the ping command runs', async function () {
		await browser.executeObsidianCommand(`${PLUGIN_ID}:ping`);
		await expect($('.notice')).toHaveText(
			expect.stringContaining(BRITISH.notices.pingSucceeded),
		);
	});

	it('opens its settings tab with the language setting', async function () {
		await browser.executeObsidian(({ app }, pluginId) => {
			const settingView: InternalAppView = app;
			settingView.setting?.open();
			settingView.setting?.openTabById(pluginId);
		}, PLUGIN_ID);
		try {
			// Settings open in a separate pop-out window, which becomes the active document, so the
			// tab is read from inside Obsidian rather than through the main window's elements.
			await browser.waitUntil(async () => {
				const tabText = await browser.executeObsidian(
					() =>
						activeDocument.querySelector('.mod-settings .vertical-tab-content')
							?.textContent ?? '',
				);
				return tabText.includes(BRITISH.settings.languageName);
			});
		} finally {
			await browser.executeObsidian(({ app }) => {
				const settingView: InternalAppView = app;
				settingView.setting?.close();
			});
		}
	});

	it('writes no console errors when disabled and enabled again', async function () {
		await browser.executeObsidian((_obsidian, recordedErrorsKey) => {
			const recordedErrors: string[] = [];
			const originalError = console.error;
			console.error = (...errorParts: unknown[]) => {
				recordedErrors.push(errorParts.map((part) => String(part)).join(' '));
				originalError(...errorParts);
			};
			Reflect.set(window, recordedErrorsKey, recordedErrors);
		}, RECORDED_ERRORS_KEY);
		await obsidianPage.disablePlugin(PLUGIN_ID);
		await obsidianPage.enablePlugin(PLUGIN_ID);
		await removeShownNotices();
		await browser.executeObsidianCommand(`${PLUGIN_ID}:ping`);
		await expect($('.notice')).toHaveText(
			expect.stringContaining(BRITISH.notices.pingSucceeded),
		);
		expect(await countNoticesWithText(BRITISH.notices.pingSucceeded)).toBe(1);
		const recordedErrors = await browser.executeObsidian((_obsidian, recordedErrorsKey) => {
			const recorded: unknown = Reflect.get(window, recordedErrorsKey);
			return Array.isArray(recorded)
				? recorded.map((entry) => String(entry))
				: ['recorder missing'];
		}, RECORDED_ERRORS_KEY);
		expect(recordedErrors).toEqual([]);
	});

	it('saves a setting and reads it back after a reload of the plugin', async function () {
		expect(await setLanguage('en-US')).toBe(true);
		const settingsText = await browser.executeObsidian(({ app }) =>
			app.vault.adapter.read('.task-orchestrator/settings.json'),
		);
		expect(settingsText).toContain('"language": "en-US"');
		await obsidianPage.disablePlugin(PLUGIN_ID);
		await obsidianPage.enablePlugin(PLUGIN_ID);
		const languageAfterReload = await browser.executeObsidian(async ({ plugins }) => {
			const result = await plugins.taskOrchestrator.core.query({
				name: 'settings',
				version: 1,
				actor: 'application',
				payload: {},
			});
			return result.ok ? result.outcome.settings.language : null;
		});
		expect(languageAfterReload).toBe('en-US');
		expect(await setLanguage('en-GB')).toBe(true);
	});

	it('writes front matter through the vault adapter and refuses a stale expectation', async function () {
		const firstWrite = await browser.executeObsidian(({ plugins }, noteId) => {
			return plugins.taskOrchestrator.adapters.vault.patchFrontMatter(
				noteId,
				{ type: 'project' },
				{ type: 'reference' },
			);
		}, FIXTURE_NOTE_ID);
		expect(firstWrite).toEqual({
			status: 'written',
			appliedFields: ['type'],
			conflictingFields: [],
		});
		await browser.waitUntil(async () => {
			const cachedType = await browser.executeObsidian(({ app, obsidian }, notePath) => {
				const file = app.vault.getAbstractFileByPath(notePath);
				const frontMatter: unknown =
					file instanceof obsidian.TFile
						? app.metadataCache.getFileCache(file)?.frontmatter?.type
						: undefined;
				return frontMatter;
			}, FIXTURE_NOTE_PATH);
			return cachedType === 'project';
		});
		const staleWrite = await browser.executeObsidian(({ plugins }, noteId) => {
			return plugins.taskOrchestrator.adapters.vault.patchFrontMatter(
				noteId,
				{ type: 'area' },
				{ type: 'reference' },
			);
		}, FIXTURE_NOTE_ID);
		expect(staleWrite).toEqual({
			status: 'written',
			appliedFields: [],
			conflictingFields: ['type'],
		});
		expect(await obsidianPage.read(FIXTURE_NOTE_PATH)).toContain('type: project');
	});
});
