/**
 * Reading and saving the user's settings through the core. Nothing is read from or written to
 * the plugin's `data.json`: settings live in the local store (`.task-orchestrator/settings.json`).
 *
 * @packageDocumentation
 */
import { DEFAULT_USER_SETTINGS } from '@task-orchestrator/core';
import type {
	Core,
	Language,
	NotifierPort,
	SettingsChange,
	UserSettings,
} from '@task-orchestrator/core';
import { noticeForError } from '../notices.ts';

/**
 * Loads the settings with the `settings` query.
 *
 * Shows `settingsUnreadable` when the file is corrupt, and the failure's notice when the query
 * fails; in both cases the defaults are used.
 *
 * @param core - The application core.
 * @param notifier - Shows notices.
 * @returns The settings to use.
 */
export async function loadUserSettings(core: Core, notifier: NotifierPort): Promise<UserSettings> {
	const result = await core.query({
		name: 'settings',
		version: 1,
		actor: 'application',
		payload: {},
	});
	if (!result.ok) {
		notifier.notice(
			noticeForError(
				core.messagesFor(DEFAULT_USER_SETTINGS.language),
				result.error.errorCode,
			),
		);
		return DEFAULT_USER_SETTINGS;
	}
	const { settings, loadStatus } = result.outcome;
	if (loadStatus === 'corrupt') {
		notifier.notice(core.messagesFor(settings.language).notices.settingsUnreadable);
	}
	return settings;
}

/**
 * Saves a change with the `updateSettings` operation.
 *
 * @param core - The application core.
 * @param notifier - Shows the failure's notice when the save fails.
 * @param settingsChange - The settings to change.
 * @param language - The language for a failure notice.
 * @returns The saved settings, or `null` when the save failed and the caller keeps the old value.
 */
export async function saveSettingsChange(
	core: Core,
	notifier: NotifierPort,
	settingsChange: SettingsChange,
	language: Language = DEFAULT_USER_SETTINGS.language,
): Promise<UserSettings | null> {
	const result = await core.execute({
		name: 'updateSettings',
		version: 1,
		actor: 'user',
		payload: settingsChange,
	});
	if (!result.ok) {
		notifier.notice(noticeForError(core.messagesFor(language), result.error.errorCode));
		return null;
	}
	return result.outcome.settings;
}
