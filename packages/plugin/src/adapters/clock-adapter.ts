/**
 * The system clock and the user's time zone.
 *
 * @packageDocumentation
 */
import type { ClockPort } from '@task-orchestrator/core';

/**
 * Creates a clock that reads the system time and time zone.
 *
 * @returns The clock adapter.
 */
export function createObsidianClockAdapter(): ClockPort {
	return {
		now: () => new Date(),
		timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
	};
}
