import { describe, expect, it } from 'vitest';
import * as coreModule from './index.ts';
import { createCore } from './index.ts';
import { createRecordingLogSink, createTestAdapters } from './core/testing/index.ts';

describe('the public surface', () => {
	it('exports exactly three runtime values', () => {
		expect(Object.keys(coreModule).sort()).toEqual([
			'DEFAULT_USER_SETTINGS',
			'createCore',
			'frontMatterValuesEqual',
		]);
	});
});

describe('createCore', () => {
	it('runs ping through execute with a typed outcome', async () => {
		const core = createCore(createTestAdapters());
		const result = await core.execute({ name: 'ping', version: 1, actor: 'user', payload: {} });
		expect(result.ok && result.outcome.respondedAt).toBe('2026-01-01T09:00:00.000Z');
	});

	it('runs the settings query through query', async () => {
		const core = createCore(createTestAdapters());
		const result = await core.query({
			name: 'settings',
			version: 1,
			actor: 'user',
			payload: {},
		});
		expect(result.ok && result.outcome.loadStatus).toBe('defaulted');
	});

	it('gives hosts a logger that writes through the same sink', () => {
		const logSink = createRecordingLogSink();
		createCore(createTestAdapters({ logSink })).logger.info('plugin.lifecycle.load_completed');
		expect(logSink.lines.map((line) => line.event)).toEqual([
			'plugin.lifecycle.load_completed',
		]);
	});

	it('drops lines below the minimum log level it was given', async () => {
		const logSink = createRecordingLogSink();
		const core = createCore(createTestAdapters({ logSink }), { minimumLogLevel: 'warn' });
		await core.execute({ name: 'ping', version: 1, actor: 'user', payload: {} });
		expect(logSink.lines).toEqual([]);
	});

	it('gives hosts the wording for a language', () => {
		const core = createCore(createTestAdapters());
		expect(core.messagesFor('en-US').settings.languageOptionAmerican).toBe('US English');
	});
});
