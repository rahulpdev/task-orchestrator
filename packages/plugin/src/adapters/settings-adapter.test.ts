import { describe, expect, it } from 'vitest';
import { createObsidianSettingsAdapter } from './settings-adapter.ts';

function createPluginSettingsFile(initialValue: unknown): {
	savedValue: unknown;
	loadData(): Promise<unknown>;
	saveData(data: unknown): Promise<void>;
} {
	const pluginSettingsFile = {
		savedValue: initialValue,
		loadData: () => Promise.resolve(pluginSettingsFile.savedValue),
		saveData: (data: unknown) => {
			pluginSettingsFile.savedValue = data;
			return Promise.resolve();
		},
	};
	return pluginSettingsFile;
}

describe('createObsidianSettingsAdapter', () => {
	it('gives null when nothing has been saved', async () => {
		const settings = createObsidianSettingsAdapter(createPluginSettingsFile(null));
		expect(await settings.load()).toBeNull();
	});

	it('saves the whole value through saveData and reads it back through loadData', async () => {
		const pluginSettingsFile = createPluginSettingsFile({ language: 'en-GB' });
		const settings = createObsidianSettingsAdapter(pluginSettingsFile);
		await settings.save({ language: 'en-US' });
		expect(pluginSettingsFile.savedValue).toEqual({ language: 'en-US' });
		expect(await settings.load()).toEqual({ language: 'en-US' });
	});

	it('lets a failed load reach the caller', async () => {
		const settings = createObsidianSettingsAdapter({
			loadData: () => Promise.reject(new Error('unreadable')),
			saveData: () => Promise.resolve(),
		});
		await expect(settings.load()).rejects.toThrow('unreadable');
	});
});
