/**
 * The single conflict rule every vault adapter applies to front-matter values.
 *
 * @packageDocumentation
 */
import type { FrontMatterValue } from './ports.ts';

/**
 * The single conflict rule every vault adapter applies (TAD E7): does a field still hold the
 * value the caller expected? Compares by JSON value, with object keys in any order; a missing
 * field equals an expectation of `null`.
 *
 * @param currentValue - The field's current value, `undefined` when absent.
 * @param expectedValue - The expected value, `null` for "absent".
 * @returns `true` when the two are equal.
 */
export function frontMatterValuesEqual(
	currentValue: FrontMatterValue | undefined,
	expectedValue: FrontMatterValue | null,
): boolean {
	return stableJson(currentValue ?? null) === stableJson(expectedValue);
}

function stableJson(value: FrontMatterValue | null): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}
	if (isFrontMatterArray(value)) {
		return `[${value.map((item) => stableJson(item)).join(',')}]`;
	}
	const fieldNames = Object.keys(value).sort();
	const parts = fieldNames.map(
		(fieldName) => `${JSON.stringify(fieldName)}:${stableJson(value[fieldName] ?? null)}`,
	);
	return `{${parts.join(',')}}`;
}

function isFrontMatterArray(value: FrontMatterValue): value is readonly FrontMatterValue[] {
	return Array.isArray(value);
}
