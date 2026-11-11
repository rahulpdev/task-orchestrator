/**
 * Converting Obsidian's untyped front matter into the core's front matter type, and applying a
 * patch to it with the shared conflict rule.
 *
 * @packageDocumentation
 */
import { frontMatterValuesEqual } from '@task-orchestrator/core';
import type {
	FrontMatter,
	FrontMatterExpectation,
	FrontMatterPatch,
	FrontMatterValue,
	VaultWriteOutcome,
} from '@task-orchestrator/core';

/**
 * Keeps only the values front matter may hold; `null` and other values are dropped.
 *
 * @param rawFrontMatter - Front matter as Obsidian gives it.
 * @returns The front matter, empty when the input is not a mapping.
 */
export function toFrontMatter(rawFrontMatter: unknown): FrontMatter {
	if (
		typeof rawFrontMatter !== 'object' ||
		rawFrontMatter === null ||
		Array.isArray(rawFrontMatter)
	) {
		return {};
	}
	const frontMatter: Record<string, FrontMatterValue> = {};
	for (const [fieldName, fieldValue] of Object.entries(rawFrontMatter)) {
		const converted = toFrontMatterValue(fieldValue);
		if (converted !== undefined) {
			frontMatter[fieldName] = converted;
		}
	}
	return frontMatter;
}

function toFrontMatterValue(value: unknown): FrontMatterValue | undefined {
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return value;
	}
	if (Array.isArray(value)) {
		return value.flatMap((item: unknown) => {
			const converted = toFrontMatterValue(item);
			return converted === undefined ? [] : [converted];
		});
	}
	return typeof value === 'object' && value !== null ? toFrontMatter(value) : undefined;
}

/**
 * Applies a patch in place to the front matter object Obsidian hands to `processFrontMatter`.
 * A field changes only when it has no expectation or still holds the expected value.
 *
 * @param rawFrontMatter - The mutable front matter object.
 * @param patch - Fields to set; `null` removes a field.
 * @param expected - The value each field should hold now; `null` means absent.
 * @returns Which fields were applied and which conflicted.
 */
export function applyPatchInPlace(
	rawFrontMatter: Record<string, unknown>,
	patch: FrontMatterPatch,
	expected: FrontMatterExpectation,
): VaultWriteOutcome {
	const current = toFrontMatter(rawFrontMatter);
	const appliedFields: string[] = [];
	const conflictingFields: string[] = [];
	for (const [fieldName, newValue] of Object.entries(patch)) {
		const expectedValue = expected[fieldName];
		if (
			expectedValue !== undefined &&
			!frontMatterValuesEqual(current[fieldName], expectedValue)
		) {
			conflictingFields.push(fieldName);
			continue;
		}
		if (newValue === null) {
			Reflect.deleteProperty(rawFrontMatter, fieldName);
		} else {
			rawFrontMatter[fieldName] = newValue;
		}
		appliedFields.push(fieldName);
	}
	return { status: 'written', appliedFields, conflictingFields };
}
