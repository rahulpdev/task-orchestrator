/**
 * UK English wording.
 *
 * @packageDocumentation
 */
import type { MessageCatalogue } from './types.ts';

/** Every word the application shows, in UK English. */
export const EN_GB_MESSAGES = {
	commands: {
		pingName: 'Check that the application core responds',
	},
	notices: {
		pingSucceeded: 'Personal Task Orchestrator is working.',
		settingsUnreadable:
			'Your settings could not be read, so the defaults are in use for now. Your settings file has not been changed.',
		operationFailed: (errorCode: string) =>
			`Something went wrong (error code ${errorCode}). Try again. If it keeps happening, include this code in a support request.`,
	},
	settings: {
		languageName: 'Language and spelling',
		languageDescription:
			'The English spelling the application uses in what it shows and writes.',
		languageOptionBritish: 'UK English',
		languageOptionAmerican: 'US English',
	},
	errorNotices: {
		CORE_TARGET_NOT_FOUND:
			'The note this action needs could not be found. It may have been renamed, moved or deleted.',
		CORE_INPUT_INVALID:
			'This action was given information it cannot use, so nothing was changed. Check what you entered and try again.',
		CORE_CONFIRMATION_REQUIRED:
			'This action needs your confirmation before it can go ahead. Nothing has been changed yet.',
		CORE_STORE_UNAVAILABLE:
			'The application could not read or save its own files in your vault. Nothing was changed. Try again in a moment.',
		CORE_INTERNAL_ERROR:
			'Something unexpected went wrong, so nothing was changed. Try again. If it keeps happening, include the error code CORE_INTERNAL_ERROR in a support request.',
		SETTINGS_FILE_UNREADABLE:
			'Your settings file could not be read, so this change was not saved and the file was left as it is. Fix or delete the file, then try again.',
	},
} satisfies MessageCatalogue;
