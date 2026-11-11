/**
 * Schemas for the user's settings file, `.task-orchestrator/settings.json`.
 *
 * @packageDocumentation
 */
import * as z from 'zod';
import { LANGUAGES } from '../core/messages/index.ts';

/** Where the settings live, relative to the local store folder. */
export const SETTINGS_STORE_PATH = 'settings.json';

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

/**
 * The saved settings. Unknown keys are kept (`looseObject`), so a file written by a newer
 * version never loses fields when this version saves it.
 */
export const UserSettingsSchema = z.looseObject({
	language: z.enum(LANGUAGES).default('en-GB'),
	appliedSettingsMigrations: z.array(z.string()).default([]),
	minimumLogLevel: z.enum(LOG_LEVELS).default('info'),
});

/** The user's settings after defaults are filled in. */
export type UserSettings = z.infer<typeof UserSettingsSchema>;

/** The settings a new or unreadable settings file falls back to. */
export const DEFAULT_USER_SETTINGS: UserSettings = UserSettingsSchema.parse({});

/** A change the user may make; any other key is refused. */
export const SettingsChangeSchema = z.strictObject({
	language: z.enum(LANGUAGES).optional(),
	minimumLogLevel: z.enum(LOG_LEVELS).optional(),
});

/** A validated settings change. */
export type SettingsChange = z.infer<typeof SettingsChangeSchema>;
