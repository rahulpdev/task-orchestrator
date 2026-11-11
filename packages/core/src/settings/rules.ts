/**
 * Rules for reading the settings file and upgrading it between versions.
 *
 * @packageDocumentation
 */
import { DEFAULT_USER_SETTINGS, UserSettingsSchema } from './schemas.ts';
import type { UserSettings } from './schemas.ts';

/** The result of parsing a settings file. */
export interface ParsedSettingsFile {
	readonly settings: UserSettings;
	/** `corrupt` means the defaults are in use because the file could not be understood. */
	readonly loadStatus: 'valid' | 'corrupt';
}

/** One named, idempotent upgrade step for saved settings. */
export interface SettingsMigration {
	/** Recorded in `appliedSettingsMigrations` once the step has run. */
	readonly migrationName: string;
	/**
	 * Upgrades the settings.
	 *
	 * @param settings - The settings before this step.
	 * @returns The settings after this step.
	 */
	migrate(settings: UserSettings): UserSettings;
}

/** The result of running migrations. */
export interface MigrationRun {
	readonly settings: UserSettings;
	/** Name of the step that threw; the settings are then returned unchanged. */
	readonly migrationFailed?: string;
}

/** Every migration, in the order they run. Empty until a setting changes shape. */
export const SETTINGS_MIGRATIONS: readonly SettingsMigration[] = [];

/**
 * Parses the settings file's text. Never throws.
 *
 * @param fileContents - The file's text.
 * @returns The settings and `valid`, or the defaults and `corrupt` for invalid JSON, a
 * non-object, or a field of the wrong type.
 */
export function parseSettingsFile(fileContents: string): ParsedSettingsFile {
	let parsedJson: unknown;
	try {
		parsedJson = JSON.parse(fileContents);
	} catch {
		return { settings: DEFAULT_USER_SETTINGS, loadStatus: 'corrupt' };
	}
	if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson)) {
		return { settings: DEFAULT_USER_SETTINGS, loadStatus: 'corrupt' };
	}
	const parsedSettings = UserSettingsSchema.safeParse(parsedJson);
	return parsedSettings.success
		? { settings: parsedSettings.data, loadStatus: 'valid' }
		: { settings: DEFAULT_USER_SETTINGS, loadStatus: 'corrupt' };
}

/**
 * Runs, in order, each migration not yet named in `appliedSettingsMigrations`, recording each
 * name as it completes. Running twice changes nothing the second time.
 *
 * @param settings - The settings as loaded.
 * @param migrations - The migrations to consider.
 * @returns The upgraded settings, or the unchanged settings and the name of a step that threw.
 */
export function applySettingsMigrations(
	settings: UserSettings,
	migrations: readonly SettingsMigration[],
): MigrationRun {
	let upgraded = settings;
	for (const migration of migrations) {
		if (upgraded.appliedSettingsMigrations.includes(migration.migrationName)) {
			continue;
		}
		try {
			const migrated = migration.migrate(upgraded);
			upgraded = {
				...migrated,
				appliedSettingsMigrations: [
					...migrated.appliedSettingsMigrations,
					migration.migrationName,
				],
			};
		} catch {
			return { settings, migrationFailed: migration.migrationName };
		}
	}
	return { settings: upgraded };
}
