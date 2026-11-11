import { describe, expect, it } from 'vitest';
import { newCorrelationId, newId } from './ids.ts';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newId', () => {
	it('returns a version 4 UUID', () => {
		expect(newId()).toMatch(UUID_V4_PATTERN);
	});

	it('returns a different value on each call', () => {
		expect(newId()).not.toBe(newId());
	});
});

describe('newCorrelationId', () => {
	it('returns a version 4 UUID', () => {
		expect(newCorrelationId()).toMatch(UUID_V4_PATTERN);
	});

	it('returns a different value on each call', () => {
		expect(newCorrelationId()).not.toBe(newCorrelationId());
	});
});
