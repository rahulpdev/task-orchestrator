/**
 * Log sinks for the test client: JSON lines on standard error, or kept in memory for tests.
 *
 * @packageDocumentation
 */
import process from 'node:process';
import type { LogEvent, LogSink } from '@task-orchestrator/core';

/** A sink that keeps every line, for assertions. */
export interface MemoryLogSink extends LogSink {
	readonly lines: readonly LogEvent[];
}

/**
 * Creates a sink that writes each event as one JSON line to standard error.
 *
 * @returns The sink.
 */
export function createStderrLogSink(): LogSink {
	return {
		write: (logEvent) => {
			process.stderr.write(`${JSON.stringify(logEvent)}\n`);
		},
	};
}

/**
 * Creates a sink that keeps every event in memory.
 *
 * @returns The sink and its lines.
 */
export function createMemoryLogSink(): MemoryLogSink {
	const lines: LogEvent[] = [];
	return {
		lines,
		write: (logEvent) => {
			lines.push(logEvent);
		},
	};
}
