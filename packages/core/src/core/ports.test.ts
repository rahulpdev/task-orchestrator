import { describe, expect, it } from 'vitest';
import { frontMatterValuesEqual } from './ports.ts';

describe('frontMatterValuesEqual', () => {
	it('treats a missing field as equal to an expectation of null', () => {
		expect(frontMatterValuesEqual(undefined, null)).toBe(true);
	});

	it('treats a present field as different from an expectation of null', () => {
		expect(frontMatterValuesEqual('reference', null)).toBe(false);
	});

	it('compares scalars by value and type', () => {
		expect(frontMatterValuesEqual('1', '1')).toBe(true);
		expect(frontMatterValuesEqual(1, '1')).toBe(false);
		expect(frontMatterValuesEqual(true, true)).toBe(true);
	});

	it('treats arrays that differ only in order as different', () => {
		expect(frontMatterValuesEqual(['a', 'b'], ['b', 'a'])).toBe(false);
		expect(frontMatterValuesEqual(['a', 'b'], ['a', 'b'])).toBe(true);
	});

	it('treats objects with the same fields in a different order as equal', () => {
		expect(frontMatterValuesEqual({ first: 1, second: [2] }, { second: [2], first: 1 })).toBe(
			true,
		);
		expect(frontMatterValuesEqual({ first: 1 }, { first: 2 })).toBe(false);
	});
});
