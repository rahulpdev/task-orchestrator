/**
 * Schemas for the user's settings, saved through the settings port.
 *
 * @packageDocumentation
 */
import * as z from 'zod';
import { LANGUAGES } from '../core/messages/index.ts';

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

/**
 * The saved settings. Unknown keys are kept (`looseObject`), so settings saved by a newer
 * version keep their fields when this version saves them.
 */
export const UserSettingsSchema = z.looseObject({
	language: z.enum(LANGUAGES).default('en-GB'),
	appliedSettingsMigrations: z.array(z.string()).default([]),
	minimumLogLevel: z.enum(LOG_LEVELS).default('info'),
});

/** The user's settings after defaults are filled in. */
export type UserSettings = z.infer<typeof UserSettingsSchema>;

/** The settings used when nothing is saved or the saved settings are damaged. */
export const DEFAULT_USER_SETTINGS: UserSettings = UserSettingsSchema.parse({});

/** A change the user may make; any other key is refused. */
export const SettingsChangeSchema = z.strictObject({
	language: z.enum(LANGUAGES).optional(),
	minimumLogLevel: z.enum(LOG_LEVELS).optional(),
});

/** A validated settings change. */
export type SettingsChange = z.infer<typeof SettingsChangeSchema>;
