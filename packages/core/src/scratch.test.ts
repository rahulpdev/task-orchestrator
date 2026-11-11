import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildOptions, firstLength, greet, greetAfterDelay, sides } from './scratch.ts';
import type { Scheduler } from './scratch.ts';

describe('greet', () => {
	it('returns a greeting that names the person', () => {
		expect(greet('Ada')).toBe('Hello, Ada');
	});
});

describe('firstLength', () => {
	it('returns the length of the first name when the list has names', () => {
		expect(firstLength(['Ada', 'Grace'])).toBe(3);
	});

	it('returns 0 when the list is empty', () => {
		expect(firstLength([])).toBe(0);
	});
});

describe('buildOptions', () => {
	it('leaves the label key out when no label is given', () => {
		expect('label' in buildOptions()).toBe(false);
	});

	it('keeps the label when one is given', () => {
		expect(buildOptions('tag')).toEqual({ label: 'tag' });
	});
});

describe('sides', () => {
	it('counts the straight sides of each shape', () => {
		expect([sides('circle'), sides('square'), sides('triangle')]).toEqual([0, 4, 3]);
	});
});

describe('greetAfterDelay', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('resolves only after the delay has passed on the injected scheduler', async () => {
		vi.useFakeTimers();
		const schedule: Scheduler = (callback, delayMs) => {
			setTimeout(callback, delayMs);
		};
		let settledGreeting: string | null = null;
		const pendingGreeting = greetAfterDelay('Ada', 1000, schedule).then((greeting) => {
			settledGreeting = greeting;
			return greeting;
		});

		await vi.advanceTimersByTimeAsync(999);
		expect(settledGreeting).toBeNull();

		await vi.advanceTimersByTimeAsync(1);
		expect(settledGreeting).toBe('Hello, Ada');
		await expect(pendingGreeting).resolves.toBe('Hello, Ada');
	});
});
