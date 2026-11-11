/**
 * Ports: the interfaces the core uses to reach the outside world. Each host supplies one
 * adapter object per port.
 *
 * @packageDocumentation
 */
import type { LogEvent } from './logging.ts';

/** Receives finished log lines. */
export interface LogSink {
	/**
	 * Delivers one finished log line.
	 *
	 * @param logEvent - The complete event, ready to serialise as one JSON object.
	 */
	write(logEvent: LogEvent): void;
}

/** Source of the current time and the user's time zone. */
export interface ClockPort {
	/**
	 * Reads the current time.
	 *
	 * @returns The current moment.
	 */
	now(): Date;

	/**
	 * Reads the user's time zone.
	 *
	 * @returns An IANA zone name such as `Europe/London`.
	 */
	timezone(): string;
}
