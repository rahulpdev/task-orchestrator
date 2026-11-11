/**
 * Clocks for the test client: the system clock, or a pretend clock moved by hand.
 *
 * @packageDocumentation
 */
import type { ClockPort } from '@task-orchestrator/core';

/** A clock that only moves when told to. */
export interface PretendClock extends ClockPort {
	/**
	 * Moves the clock forward.
	 *
	 * @param milliseconds - How far to move.
	 */
	advanceBy(milliseconds: number): void;
}

/**
 * Creates a clock that reads the system time and time zone.
 *
 * @returns The system clock.
 */
export function createSystemClock(): ClockPort {
	return {
		now: () => new Date(),
		timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
	};
}

/**
 * Creates a clock that starts at a fixed moment and only moves when told to.
 *
 * @param startAt - The first moment the clock reports.
 * @param timezoneName - The IANA zone the clock reports.
 * @returns The pretend clock.
 */
export function createPretendClock(
	startAt: Date | string,
	timezoneName = 'Europe/London',
): PretendClock {
	let currentTime = new Date(startAt).getTime();
	return {
		now: () => new Date(currentTime),
		timezone: () => timezoneName,
		advanceBy: (milliseconds) => {
			currentTime += milliseconds;
		},
	};
}
