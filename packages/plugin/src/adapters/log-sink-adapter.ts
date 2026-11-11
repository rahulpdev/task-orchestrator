/**
 * The log sink: each line goes to the developer console and is appended to the month's file in
 * the local store, `logs/application-YYYY-MM.jsonl` (TAD 6.1).
 *
 * @packageDocumentation
 */
import type { LogLevel, LogSink, StorePort } from '@task-orchestrator/core';

/** The sink plus a way to wait for every pending append. */
export interface ObsidianLogSink extends LogSink {
	/**
	 * Waits until every line written so far has been appended to the store.
	 *
	 * @returns A promise that settles once the appends have finished.
	 */
	flush(): Promise<void>;
}

const LEVEL_ORDER: Readonly<Record<LogLevel, number>> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
};

/**
 * Creates the log sink.
 *
 * @param store - The local store the log files live in.
 * @param currentMinimumLevel - Read on every line, so a settings change applies at once.
 * @returns The sink. `write` stays synchronous; appends run one after another in the background.
 */
export function createObsidianLogSink(
	store: StorePort,
	currentMinimumLevel: () => LogLevel,
): ObsidianLogSink {
	let pendingAppends: Promise<void> = Promise.resolve();
	return {
		write: (logEvent) => {
			if (LEVEL_ORDER[logEvent.level] < LEVEL_ORDER[currentMinimumLevel()]) {
				return;
			}
			const line = JSON.stringify(logEvent);
			if (logEvent.level === 'error') {
				console.error(line);
			} else if (logEvent.level === 'warn') {
				console.warn(line);
			} else {
				console.debug(line);
			}
			const logPath = `logs/application-${logEvent.timestamp.slice(0, 7)}.jsonl`;
			pendingAppends = pendingAppends
				.then(() => store.appendLine(logPath, line))
				.catch((thrown: unknown) => {
					console.error(
						'Personal Task Orchestrator could not write its log file.',
						thrown,
					);
				});
		},
		flush: () => pendingAppends,
	};
}
