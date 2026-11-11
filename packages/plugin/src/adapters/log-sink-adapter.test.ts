import type { LogEvent, LogLevel } from '@task-orchestrator/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStore } from '../test-helpers/fake-core.ts';
import { createObsidianLogSink } from './log-sink-adapter.ts';

function eventAt(level: LogLevel): LogEvent {
	return { event: 'plugin.test.line_written', level, timestamp: '2026-11-10T09:30:00.000Z' };
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('createObsidianLogSink', () => {
	it('routes each level to the right console method and appends to the month file', async () => {
		const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const storeFiles = new Map<string, string>();
		const logSink = createObsidianLogSink(createMemoryStore(storeFiles), () => 'debug');
		for (const level of ['debug', 'info', 'warn', 'error'] as const) {
			logSink.write(eventAt(level));
		}
		await logSink.flush();
		expect([
			debugSpy.mock.calls.length,
			warnSpy.mock.calls.length,
			errorSpy.mock.calls.length,
		]).toEqual([2, 1, 1]);
		const monthFile = storeFiles.get('logs/application-2026-11.jsonl') ?? '';
		expect(
			monthFile
				.trim()
				.split('\n')
				.map((line): unknown => JSON.parse(line)),
		).toHaveLength(4);
	});

	it('drops lines below the current minimum level, read on every line', async () => {
		vi.spyOn(console, 'debug').mockImplementation(() => undefined);
		const storeFiles = new Map<string, string>();
		let minimumLevel: LogLevel = 'warn';
		const logSink = createObsidianLogSink(createMemoryStore(storeFiles), () => minimumLevel);
		logSink.write(eventAt('info'));
		minimumLevel = 'info';
		logSink.write(eventAt('info'));
		await logSink.flush();
		expect(storeFiles.get('logs/application-2026-11.jsonl')?.trim().split('\n')).toHaveLength(
			1,
		);
	});

	it('reports a failed append once and keeps appending later lines', async () => {
		vi.spyOn(console, 'debug').mockImplementation(() => undefined);
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const storeFiles = new Map<string, string>();
		const store = createMemoryStore(storeFiles);
		let failNext = true;
		const flakyStore = {
			...store,
			appendLine: (storePath: string, line: string) => {
				if (failNext) {
					failNext = false;
					return Promise.reject(new Error('disk full'));
				}
				return store.appendLine(storePath, line);
			},
		};
		const logSink = createObsidianLogSink(flakyStore, () => 'debug');
		logSink.write(eventAt('info'));
		logSink.write(eventAt('info'));
		await logSink.flush();
		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(storeFiles.get('logs/application-2026-11.jsonl')?.trim().split('\n')).toHaveLength(
			1,
		);
	});
});
