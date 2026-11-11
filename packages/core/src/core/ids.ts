/**
 * Identifier generation for the application core.
 *
 * @packageDocumentation
 */

/**
 * Creates a new random identifier.
 *
 * @returns A version 4 UUID such as `3b241101-e2bb-4255-8caf-4136c566a962`.
 */
export function newId(): string {
	return crypto.randomUUID();
}

/**
 * Creates a new correlation ID, which ties together every log line written for one request.
 *
 * This is the single place to change if correlation IDs become ULIDs (TAD 2.7) when the
 * vault audit log arrives; every caller goes through this function.
 *
 * @returns A new, unique correlation ID.
 */
export function newCorrelationId(): string {
	return newId();
}
