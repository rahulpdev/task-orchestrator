/**
 * Date helpers shared by several slices.
 *
 * @packageDocumentation
 */

const FULL_ISO_PATTERN =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Formats a moment as an ISO 8601 UTC string.
 *
 * @param date - The moment to format.
 * @returns Text such as `2026-11-10T09:30:00.000Z`.
 */
export function toIsoUtc(date: Date): string {
	return date.toISOString();
}

/**
 * Parses a full ISO 8601 date and time that states its offset.
 *
 * A date on its own, or a time without `Z` or an offset, is ambiguous and gives `null`.
 *
 * @param isoText - Text such as `2026-11-10T10:30:00+01:00`.
 * @returns The moment, or `null` when the text is not a full, valid ISO 8601 timestamp.
 */
export function fromIso(isoText: string): Date | null {
	if (!FULL_ISO_PATTERN.test(isoText)) {
		return null;
	}
	const parsed = new Date(isoText);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}
