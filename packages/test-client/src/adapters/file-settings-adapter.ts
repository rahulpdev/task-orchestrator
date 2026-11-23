/**
 * The user's settings in the same file the host application keeps for the plugin, for the test
 * client: `<vault>/<config folder>/plugins/task-orchestrator/data.json`.
 *
 * Each install of the host application may rename its config folder, and the test client runs
 * without the host application, so the caller names the folder.
 *
 * @packageDocumentation
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { SettingsPort } from '@task-orchestrator/core';
import { writeFileAtomically } from './note-file.ts';

/** The settings file's path inside the config folder: the plugin folder, then the file. */
export const PLUGIN_SETTINGS_FILE_PARTS = ['plugins', 'task-orchestrator', 'data.json'] as const;

/**
 * Checks that a config folder name is one folder at the top of the vault.
 *
 * @param configFolderName - The name to check.
 * @returns `true` for a single, non-empty folder name that is not `.` or `..`.
 */
export function isConfigFolderName(configFolderName: string): boolean {
	return (
		configFolderName !== '' &&
		configFolderName !== '.' &&
		configFolderName !== '..' &&
		!/[\\/]/.test(configFolderName)
	);
}

/**
 * Builds the settings file's full path.
 *
 * @param vaultPath - The vault's root folder.
 * @param configFolderName - The vault's config folder name.
 * @returns The absolute path of the plugin's settings file.
 */
export function settingsFilePathFor(vaultPath: string, configFolderName: string): string {
	return path.resolve(vaultPath, configFolderName, ...PLUGIN_SETTINGS_FILE_PARTS);
}

/**
 * Creates a settings adapter over the vault's settings file for the plugin.
 *
 * @param vaultPath - The vault's root folder.
 * @param configFolderName - The vault's config folder name; one folder, no separators.
 * @returns The settings adapter. `load` gives `null` for a missing file and throws for text
 * that is not JSON.
 * @throws Error when `configFolderName` is not a single folder name.
 */
export function createFileSettingsAdapter(
	vaultPath: string,
	configFolderName: string,
): SettingsPort {
	if (!isConfigFolderName(configFolderName)) {
		throw new Error(`Not a single folder name: ${configFolderName}`);
	}
	const settingsFilePath = settingsFilePathFor(vaultPath, configFolderName);
	return {
		load: async () => {
			let fileContents: string;
			try {
				fileContents = await readFile(settingsFilePath, 'utf8');
			} catch (thrown: unknown) {
				if (thrown instanceof Error && 'code' in thrown && thrown.code === 'ENOENT') {
					return null;
				}
				throw thrown;
			}
			const savedValue: unknown = JSON.parse(fileContents);
			return savedValue;
		},
		save: (settings) =>
			writeFileAtomically(settingsFilePath, `${JSON.stringify(settings, null, '\t')}\n`),
	};
}
