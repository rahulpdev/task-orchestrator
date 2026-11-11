/**
 * Small adapters for core tests: a clock the test moves by hand, and adapters that record what
 * they were given.
 *
 * @packageDocumentation
 */
import type { LogEvent } from '../logging.ts';
import type { ClockPort, LogSink, NotifierPort, SecretsPort } from '../ports.ts';

/** A clock that only moves when told to. */
export interface PretendClock extends ClockPort {
	/**
	 * Moves the clock forward.
	 *
	 * @param milliseconds - How far to move.
	 */
	advanceBy(milliseconds: number): void;
}

/** A notifier that records each message instead of showing it. */
export interface RecordingNotifier extends NotifierPort {
	readonly shownNotices: string[];
}

/** A log sink that keeps every line, for assertions. */
export interface RecordingLogSink extends LogSink {
	readonly lines: LogEvent[];
}

/** Secrets held in memory, plus direct access for assertions. */
export interface InMemorySecrets extends SecretsPort {
	readonly storedSecrets: Map<string, string>;
}

/**
 * Creates a clock that starts at a fixed moment and only moves when told to.
 *
 * @param startAt - The first moment the clock reports.
 * @param timezoneName - The IANA zone the clock reports.
 * @returns The pretend clock.
 */
export function createPretendClock(
	startAt: Date | string = '2026-01-01T09:00:00.000Z',
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

/**
 * Creates a notifier that records each message.
 *
 * @returns The recording notifier.
 */
export function createRecordingNotifier(): RecordingNotifier {
	const shownNotices: string[] = [];
	return {
		shownNotices,
		notice: (message) => {
			shownNotices.push(message);
		},
	};
}

/**
 * Creates a log sink that keeps every line.
 *
 * @returns The recording sink.
 */
export function createRecordingLogSink(): RecordingLogSink {
	const lines: LogEvent[] = [];
	return {
		lines,
		write: (logEvent) => {
			lines.push(logEvent);
		},
	};
}

/**
 * Creates secret storage held in memory.
 *
 * @returns The in-memory secrets adapter.
 */
export function createInMemorySecrets(): InMemorySecrets {
	const storedSecrets = new Map<string, string>();
	return {
		storedSecrets,
		get: (secretId) => Promise.resolve(storedSecrets.get(secretId) ?? null),
		set: (secretId, secretValue) => {
			storedSecrets.set(secretId, secretValue);
			return Promise.resolve({ status: 'stored' });
		},
		delete: (secretId) => {
			storedSecrets.delete(secretId);
			return Promise.resolve();
		},
	};
}
