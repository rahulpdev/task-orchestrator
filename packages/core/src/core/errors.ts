/**
 * The error model: every expected failure is an {@link AppError} value, never a thrown error.
 *
 * Codes have the form `{DOMAIN}_{CATEGORY}_{DETAIL}`, where the domain is a feature slice name
 * or `CORE`. `message` is a short developer-facing diagnostic in English; the words a user sees
 * come from the messages catalogue, keyed by `errorCode`.
 *
 * @packageDocumentation
 */
import type { LogFieldValue } from './logging.ts';

/** The domains an error code may start with: the feature slices, plus `CORE` for shared codes. */
export const ERROR_DOMAINS = [
	'CORE',
	'CAPTURE',
	'CLARIFY',
	'ORGANISE',
	'STRUCTURE',
	'DASHBOARD',
	'REVIEW',
	'LINT',
	'VAULT',
	'EXPORT_IMPORT',
	'SETTINGS',
	'LICENSING',
	'PAID_SERVICE',
] as const;

/** One of {@link ERROR_DOMAINS}. */
export type ErrorDomain = (typeof ERROR_DOMAINS)[number];

/** An expected failure, returned as a value. */
export interface AppError {
	/** Stable code such as `CORE_INPUT_INVALID`. */
	readonly errorCode: string;
	/** Short developer-facing diagnostic in English; never shown to the user. */
	readonly message: string;
	/** Whether trying the same request again might succeed. */
	readonly retryable: boolean;
	/** Extra facts for the log, never note content or secrets. */
	readonly details?: Readonly<Record<string, LogFieldValue>>;
}

/** The codes shared by every feature. */
export const CORE_ERROR_CODES = {
	targetNotFound: 'CORE_TARGET_NOT_FOUND',
	inputInvalid: 'CORE_INPUT_INVALID',
	confirmationRequired: 'CORE_CONFIRMATION_REQUIRED',
	storeUnavailable: 'CORE_STORE_UNAVAILABLE',
	internalError: 'CORE_INTERNAL_ERROR',
} as const;

/** One of the shared codes in {@link CORE_ERROR_CODES}. */
export type CoreErrorCode = (typeof CORE_ERROR_CODES)[keyof typeof CORE_ERROR_CODES];

const CODE_REST_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z][A-Z0-9]*)+$/;

/**
 * Checks that a code is a listed domain followed by at least two upper-snake-case parts.
 *
 * @param errorCode - The code to check.
 * @returns `true` for `CORE_INPUT_INVALID` or `EXPORT_IMPORT_ARCHIVE_INVALID`; `false` for `CORE_INVALID`.
 */
export function isValidErrorCode(errorCode: string): boolean {
	return ERROR_DOMAINS.some(
		(domain) =>
			errorCode.startsWith(`${domain}_`) &&
			CODE_REST_PATTERN.test(errorCode.slice(domain.length + 1)),
	);
}

/**
 * Builds an {@link AppError}, leaving `details` out entirely when none are given.
 *
 * @param errorCode - Stable code such as `CORE_INPUT_INVALID`.
 * @param message - Short developer-facing diagnostic in English.
 * @param retryable - Whether trying again might succeed.
 * @param details - Extra facts for the log.
 * @returns The error value.
 */
export function createAppError(
	errorCode: string,
	message: string,
	retryable: boolean,
	details?: Readonly<Record<string, LogFieldValue>>,
): AppError {
	return details === undefined
		? { errorCode, message, retryable }
		: { errorCode, message, retryable, details };
}
