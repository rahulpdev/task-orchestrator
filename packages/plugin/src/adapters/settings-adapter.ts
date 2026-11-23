/**
 * The user's settings in Obsidian's own settings file for the plugin (`data.json`), through
 * `loadData` and `saveData`.
 *
 * @packageDocumentation
 */
import type { Plugin } from 'obsidian';
import type { SettingsPort } from '@task-orchestrator/core';

/** The part of the plugin this adapter uses. */
export type PluginSettingsFile = Pick<Plugin, 'loadData' | 'saveData'>;

/**
 * Creates the settings adapter over the plugin's settings file.
 *
 * @param pluginSettingsFile - The plugin, or anything with its `loadData` and `saveData`.
 * @returns The settings adapter. `load` gives `null` when nothing has been saved.
 */
export function createObsidianSettingsAdapter(
	pluginSettingsFile: PluginSettingsFile,
): SettingsPort {
	return {
		load: async () => {
			const savedValue: unknown = await pluginSettingsFile.loadData();
			return savedValue;
		},
		save: (settings) => pluginSettingsFile.saveData(settings),
	};
}
