import { DEFAULT_USER_SETTINGS } from '@task-orchestrator/core';
import { describe, expect, it } from 'vitest';
import { createFakeCore } from '../test-helpers/fake-core.ts';
import { loadUserSettings, saveSettingsChange } from './settings-state.ts';

const failingStore = {
	readFile: () => Promise.reject(new Error('disk unavailable')),
	writeFileAtomic: () => Promise.reject(new Error('disk unavailable')),
	appendLine: () => Promise.resolve(),
	listFolder: () => Promise.resolve([]),
	deleteFile: () => Promise.resolve(),
};

describe('loadUserSettings', () => {
	it('returns the saved settings and shows no notice for a valid file', async () => {
		const fake = createFakeCore({ storeFiles: { 'settings.json': '{"language":"en-US"}' } });
		const settings = await loadUserSettings(fake.core, fake.adapters.notifier);
		expect(settings.language).toBe('en-US');
		expect(fake.notices).toEqual([]);
	});

	it('returns the defaults and shows settingsUnreadable exactly once for a corrupt file', async () => {
		const fake = createFakeCore({ storeFiles: { 'settings.json': '{ not json' } });
		const settings = await loadUserSettings(fake.core, fake.adapters.notifier);
		expect(settings).toEqual(DEFAULT_USER_SETTINGS);
		expect(fake.notices).toEqual([fake.core.messagesFor('en-GB').notices.settingsUnreadable]);
	});

	it("returns the defaults and shows the code's notice when the query fails", async () => {
		const fake = createFakeCore({ store: failingStore });
		const settings = await loadUserSettings(fake.core, fake.adapters.notifier);
		expect(settings).toEqual(DEFAULT_USER_SETTINGS);
		expect(fake.notices).toEqual([
			fake.core.messagesFor('en-GB').errorNotices.CORE_STORE_UNAVAILABLE,
		]);
	});

	it('runs the settings query as the application', async () => {
		const fake = createFakeCore();
		await loadUserSettings(fake.core, fake.adapters.notifier);
		expect(fake.logLines[0]).toMatchObject({
			event: 'core.api.operation_started',
			operationName: 'settings',
			operationVersion: 1,
			actor: 'application',
		});
	});
});

describe('saveSettingsChange', () => {
	it('runs updateSettings version 1 as the user with the change as payload', async () => {
		const fake = createFakeCore();
		const saved = await saveSettingsChange(fake.core, fake.adapters.notifier, {
			language: 'en-US',
		});
		expect(saved?.language).toBe('en-US');
		expect(fake.logLines[0]).toMatchObject({
			event: 'core.api.operation_started',
			operationName: 'updateSettings',
			operationVersion: 1,
			actor: 'user',
		});
		expect(fake.storeFiles.get('settings.json')).toContain('"language": "en-US"');
	});

	it("shows the code's notice and returns null when the save fails", async () => {
		const fake = createFakeCore({ storeFiles: { 'settings.json': '{ not json' } });
		const saved = await saveSettingsChange(
			fake.core,
			fake.adapters.notifier,
			{ language: 'en-US' },
			'en-US',
		);
		expect(saved).toBeNull();
		expect(fake.notices).toEqual([
			fake.core.messagesFor('en-US').errorNotices.SETTINGS_FILE_UNREADABLE,
		]);
	});
});
