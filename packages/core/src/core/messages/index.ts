/**
 * The messages catalogue: every word the application shows lives here, once per language.
 *
 * @packageDocumentation
 */
import { EN_GB_MESSAGES } from './en-GB.ts';
import { EN_US_MESSAGES } from './en-US.ts';
import type { Language, MessageCatalogue } from './types.ts';

export { LANGUAGES } from './types.ts';
export type { KnownErrorCode, Language, MessageCatalogue } from './types.ts';

const CATALOGUES: Readonly<Record<Language, MessageCatalogue>> = {
	'en-GB': EN_GB_MESSAGES,
	'en-US': EN_US_MESSAGES,
};

/**
 * Picks the wording for a language.
 *
 * @param language - The language from the user's settings.
 * @returns The catalogue for that language.
 */
export function messagesFor(language: Language): MessageCatalogue {
	return CATALOGUES[language];
}
