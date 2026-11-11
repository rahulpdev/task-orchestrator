/**
 * The settings slice's public surface: what other slices and the core's entry point may use.
 *
 * @packageDocumentation
 */
import { settingsQuery, updateSettingsOperation } from './operations.ts';

export { DEFAULT_USER_SETTINGS } from './schemas.ts';
export type { SettingsChange, UserSettings } from './schemas.ts';

/** The settings query and the update operation, for registration. */
export const settingsOperations = [settingsQuery, updateSettingsOperation] as const;
