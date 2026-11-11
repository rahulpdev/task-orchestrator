/**
 * Helpers for choosing the words of a notice. All wording comes from the core's catalogue.
 *
 * @packageDocumentation
 */
import type { LogFieldValue, MessageCatalogue } from '@task-orchestrator/core';

/**
 * Picks the notice for a failure: its own wording when the catalogue has one, otherwise the
 * general "something went wrong" notice that quotes the code.
 *
 * @param messages - The catalogue for the user's language.
 * @param errorCode - The failure's code.
 * @returns The notice text.
 */
export function noticeForError(messages: MessageCatalogue, errorCode: string): string {
	return messages.errorNotices[errorCode] ?? messages.notices.operationFailed(errorCode);
}

/**
 * Describes a thrown value for a log line without assuming it is an `Error`.
 *
 * @param thrown - Whatever was thrown.
 * @returns Name and message for an `Error`; the value's type otherwise.
 */
export function describeError(thrown: unknown): LogFieldValue {
	return thrown instanceof Error
		? { errorName: thrown.name, errorMessage: thrown.message }
		: { thrownValueType: thrown === null ? 'null' : typeof thrown };
}
