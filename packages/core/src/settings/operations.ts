/**
 * The settings query and the update operation: the only way settings are read or written.
 *
 * @packageDocumentation
 */
import * as z from 'zod';
import { defineOperation } from '../core/api.ts';
import type { HandlerResult, OperationContext } from '../core/api.ts';
import { CORE_ERROR_CODES, createAppError } from '../core/errors.ts';
import { describeThrown } from '../core/logging.ts';
import { SETTINGS_MIGRATIONS, applySettingsMigrations, parseSavedSettings } from './rules.ts';
import { DEFAULT_USER_SETTINGS, SettingsChangeSchema, UserSettingsSchema } from './schemas.ts';
import type { UserSettings } from './schemas.ts';

/** The settings could not be read or understood, so an update would overwrite the user's data. */
export const SETTINGS_FILE_UNREADABLE = 'SETTINGS_FILE_UNREADABLE';

/** How the settings were found. */
const LoadStatusSchema = z.enum(['valid', 'defaulted', 'corrupt']);

interface LoadedSettings {
	readonly settings: UserSettings;
	readonly loadStatus: z.infer<typeof LoadStatusSchema>;
}

/** Reads the settings; nothing saved gives the defaults, and damaged settings the defaults too. */
export const settingsQuery = defineOperation({
	name: 'settings',
	version: 1,
	kind: 'query',
	request: z.object({}),
	outcome: z.object({ settings: UserSettingsSchema, loadStatus: LoadStatusSchema }),
	handler: async (_payload, context) => {
		const loaded = await loadSettings(context);
		return loaded.ok ? { ok: true, outcome: loaded.outcome } : loaded;
	},
});

/** Changes one or more settings and saves them; refuses to overwrite damaged settings. */
export const updateSettingsOperation = defineOperation({
	name: 'updateSettings',
	version: 1,
	kind: 'operation',
	request: SettingsChangeSchema,
	outcome: z.object({ settings: UserSettingsSchema }),
	handler: async (settingsChange, context) => {
		const loaded = await loadSettings(context);
		if (!loaded.ok) {
			return loaded;
		}
		if (loaded.outcome.loadStatus === 'corrupt') {
			return unreadableFailure();
		}
		const merged = UserSettingsSchema.parse({ ...loaded.outcome.settings, ...settingsChange });
		const changedSettingNames = Object.keys(settingsChange);
		try {
			await context.adapters.settings.save(merged);
		} catch (thrown: unknown) {
			context.log.error('settings.file.write_failed', {
				changedSettingNames,
				thrownError: describeThrown(thrown),
			});
			return {
				ok: false,
				error: createAppError(
					CORE_ERROR_CODES.internalError,
					'The settings could not be saved.',
					false,
				),
			};
		}
		context.log.info('settings.file.update_completed', { changedSettingNames });
		return { ok: true, outcome: { settings: merged } };
	},
});

async function loadSettings(context: OperationContext): Promise<HandlerResult<LoadedSettings>> {
	let savedValue: unknown;
	try {
		savedValue = await context.adapters.settings.load();
	} catch (thrown: unknown) {
		context.log.error('settings.file.read_failed', { thrownError: describeThrown(thrown) });
		return unreadableFailure();
	}
	if (savedValue === null) {
		return { ok: true, outcome: { settings: DEFAULT_USER_SETTINGS, loadStatus: 'defaulted' } };
	}
	const parsed = parseSavedSettings(savedValue);
	if (parsed.loadStatus === 'corrupt') {
		context.log.warn('settings.file.load_rejected', { loadStatus: parsed.loadStatus });
		return { ok: true, outcome: parsed };
	}
	const migrationRun = applySettingsMigrations(parsed.settings, SETTINGS_MIGRATIONS);
	if (migrationRun.migrationFailed !== undefined) {
		context.log.error('settings.migration.run_failed', {
			migrationName: migrationRun.migrationFailed,
		});
	}
	return { ok: true, outcome: { settings: migrationRun.settings, loadStatus: 'valid' } };
}

function unreadableFailure(): {
	readonly ok: false;
	readonly error: ReturnType<typeof createAppError>;
} {
	return {
		ok: false,
		error: createAppError(
			SETTINGS_FILE_UNREADABLE,
			'The settings file is unreadable; refusing to overwrite it.',
			false,
		),
	};
}
