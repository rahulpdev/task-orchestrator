/**
 * The shape every language's message catalogue must have.
 *
 * @packageDocumentation
 */
import type { CoreErrorCode } from '../errors.ts';

/** The languages the application can show, as BCP 47 tags. */
export const LANGUAGES = ['en-GB', 'en-US'] as const;

/** One of {@link LANGUAGES}. */
export type Language = (typeof LANGUAGES)[number];

/** Error codes every catalogue must explain to the user. */
export type KnownErrorCode = CoreErrorCode | 'SETTINGS_FILE_UNREADABLE';

/** Every word the application shows, for one language. */
export interface MessageCatalogue {
	readonly commands: {
		readonly pingName: string;
	};
	readonly notices: {
		readonly pingSucceeded: string;
		readonly settingsUnreadable: string;
		/**
		 * The fallback notice for a failure with no specific wording.
		 *
		 * @param errorCode - The failure's code, shown so the user can quote it.
		 * @returns The notice text.
		 */
		operationFailed(errorCode: string): string;
	};
	readonly settings: {
		readonly languageName: string;
		readonly languageDescription: string;
		readonly languageOptionBritish: string;
		readonly languageOptionAmerican: string;
	};
	/** A notice per error code: what happened and what to do. Unknown codes read as `undefined`. */
	readonly errorNotices: Readonly<Record<KnownErrorCode, string>> &
		Readonly<Partial<Record<string, string>>>;
}
