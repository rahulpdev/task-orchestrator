import { describe, expect, it } from 'vitest';
import { fromIso, toIsoUtc } from './dates.ts';

describe('toIsoUtc and fromIso', () => {
	it('round-trips a moment', () => {
		const moment = new Date('2026-11-10T09:30:00.000Z');
		expect(fromIso(toIsoUtc(moment))?.getTime()).toBe(moment.getTime());
	});

	it('converts an offset timestamp to UTC', () => {
		const parsed = fromIso('2026-11-10T10:30:00+01:00');
		expect(parsed === null ? null : toIsoUtc(parsed)).toBe('2026-11-10T09:30:00.000Z');
	});

	it.each(['not a date', '2026-11-10', '2026-11-10T09:30:00', '2026-13-45T99:99:00Z', ''])(
		'returns null for %j',
		(isoText) => {
			expect(fromIso(isoText)).toBeNull();
		},
	);
});
