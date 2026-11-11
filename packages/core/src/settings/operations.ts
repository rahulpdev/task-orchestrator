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
import { SETTINGS_MIGRATIONS, applySettingsMigrations, parseSettingsFile } from './rules.ts';
import {
	DEFAULT_USER_SETTINGS,
	SETTINGS_STORE_PATH,
	SettingsChangeSchema,
	UserSettingsSchema,
} from './schemas.ts';
import type { UserSettings } from './schemas.ts';

/** The settings file could not be understood, so an update would overwrite the user's data. */
export const SETTINGS_FILE_UNREADABLE = 'SETTINGS_FILE_UNREADABLE';

/** How the settings were found. */
const LoadStatusSchema = z.enum(['valid', 'defaulted', 'corrupt']);

interface LoadedSettings {
	readonly settings: UserSettings;
	readonly loadStatus: z.infer<typeof LoadStatusSchema>;
}

/** Reads the settings; a missing file gives the defaults, a damaged one the defaults too. */
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

/** Changes one or more settings and saves the file; refuses to overwrite a damaged file. */
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
			return {
				ok: false,
				error: createAppError(
					SETTINGS_FILE_UNREADABLE,
					'The settings file is unreadable; refusing to overwrite it.',
					false,
				),
			};
		}
		const merged = UserSettingsSchema.parse({ ...loaded.outcome.settings, ...settingsChange });
		const changedSettingNames = Object.keys(settingsChange);
		try {
			await context.adapters.store.writeFileAtomic(
				SETTINGS_STORE_PATH,
				`${JSON.stringify(merged, null, '\t')}\n`,
			);
		} catch (thrown: unknown) {
			return storeFailure(context, 'settings.file.write_failed', thrown);
		}
		context.log.info('settings.file.update_completed', { changedSettingNames });
		return { ok: true, outcome: { settings: merged } };
	},
});

async function loadSettings(context: OperationContext): Promise<HandlerResult<LoadedSettings>> {
	let readOutcome;
	try {
		readOutcome = await context.adapters.store.readFile(SETTINGS_STORE_PATH);
	} catch (thrown: unknown) {
		return storeFailure(context, 'settings.file.read_failed', thrown);
	}
	if (readOutcome.status === 'missing') {
		return { ok: true, outcome: { settings: DEFAULT_USER_SETTINGS, loadStatus: 'defaulted' } };
	}
	const parsed = parseSettingsFile(readOutcome.contents);
	if (parsed.loadStatus === 'corrupt') {
		context.log.warn('settings.file.load_rejected', { settingsPath: SETTINGS_STORE_PATH });
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

function storeFailure(
	context: OperationContext,
	eventName: string,
	thrown: unknown,
): { readonly ok: false; readonly error: ReturnType<typeof createAppError> } {
	context.log.error(eventName, {
		settingsPath: SETTINGS_STORE_PATH,
		thrownError: describeThrown(thrown),
	});
	return {
		ok: false,
		error: createAppError(
			CORE_ERROR_CODES.storeUnavailable,
			'The local store could not be read or written.',
			true,
		),
	};
}
