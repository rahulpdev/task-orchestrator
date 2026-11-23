import { describe, expect, it } from 'vitest';
import { createDispatcher, createOperationRegistry } from '../core/api.ts';
import type { Dispatcher } from '../core/api.ts';
import { createLogger } from '../core/logging.ts';
import type { LogEvent } from '../core/logging.ts';
import type { SettingsPort } from '../core/ports.ts';
import {
	createInMemorySettings,
	createPretendClock,
	createRecordingLogSink,
	createTestAdapters,
} from '../core/testing/index.ts';
import { settingsOperations } from './index.ts';

function buildSettingsDispatcher(settings: SettingsPort): {
	readonly dispatcher: Dispatcher;
	readonly lines: LogEvent[];
} {
	const logSink = createRecordingLogSink();
	const clock = createPretendClock();
	const adapters = createTestAdapters({ settings, logSink, clock });
	const dispatcher = createDispatcher(
		createOperationRegistry(settingsOperations),
		adapters,
		createLogger(logSink, clock),
		clock,
	);
	return { dispatcher, lines: logSink.lines };
}

const readSettings = (dispatcher: Dispatcher) =>
	dispatcher.query({ name: 'settings', version: 1, actor: 'application', payload: {} });

const updateSettings = (dispatcher: Dispatcher, payload: unknown) =>
	dispatcher.execute({ name: 'updateSettings', version: 1, actor: 'user', payload });

function throwingSettings(): SettingsPort {
	const fail = () => Promise.reject(new Error('disk unavailable'));
	return { load: fail, save: fail };
}

describe('the settings query', () => {
	it('gives the defaults and defaulted when nothing has been saved', async () => {
		const { dispatcher } = buildSettingsDispatcher(createInMemorySettings());
		expect(await readSettings(dispatcher)).toMatchObject({
			ok: true,
			outcome: { settings: { language: 'en-GB' }, loadStatus: 'defaulted' },
		});
	});

	it('reads a saved language', async () => {
		const settings = createInMemorySettings({ language: 'en-US' });
		const { dispatcher } = buildSettingsDispatcher(settings);
		expect(await readSettings(dispatcher)).toMatchObject({
			ok: true,
			outcome: { settings: { language: 'en-US' }, loadStatus: 'valid' },
		});
	});

	it('gives the defaults and corrupt for damaged settings, and logs it', async () => {
		const settings = createInMemorySettings('{ not json');
		const { dispatcher, lines } = buildSettingsDispatcher(settings);
		expect(await readSettings(dispatcher)).toMatchObject({
			outcome: { settings: { language: 'en-GB' }, loadStatus: 'corrupt' },
		});
		expect(lines.some((line) => line.event === 'settings.file.load_rejected')).toBe(true);
	});

	it('gives SETTINGS_FILE_UNREADABLE when the load throws, and logs it', async () => {
		const { dispatcher, lines } = buildSettingsDispatcher(throwingSettings());
		expect(await readSettings(dispatcher)).toMatchObject({
			ok: false,
			error: { errorCode: 'SETTINGS_FILE_UNREADABLE', retryable: false },
		});
		expect(lines.some((line) => line.event === 'settings.file.read_failed')).toBe(true);
	});
});

describe('the updateSettings operation', () => {
	it('saves the settings, and a following query returns the new value', async () => {
		const settings = createInMemorySettings();
		const { dispatcher, lines } = buildSettingsDispatcher(settings);
		expect(await updateSettings(dispatcher, { language: 'en-US' })).toMatchObject({ ok: true });
		expect(settings.savedValue).toEqual({
			language: 'en-US',
			appliedSettingsMigrations: [],
			minimumLogLevel: 'info',
		});
		expect(await readSettings(dispatcher)).toMatchObject({
			outcome: { settings: { language: 'en-US' } },
		});
		const updateLine = lines.find((line) => line.event === 'settings.file.update_completed');
		expect(updateLine?.changedSettingNames).toEqual(['language']);
	});

	it('keeps a saved key it does not recognise', async () => {
		const settings = createInMemorySettings({ language: 'en-GB', futureSetting: true });
		const { dispatcher } = buildSettingsDispatcher(settings);
		expect(await updateSettings(dispatcher, { language: 'en-US' })).toMatchObject({ ok: true });
		expect(settings.savedValue).toMatchObject({ language: 'en-US', futureSetting: true });
	});

	it.each([['{ not json'], [[]], [42], [{ minimumLogLevel: 3 }]])(
		'refuses to overwrite damaged settings %j and leaves them unchanged',
		async (damagedValue) => {
			const settings = createInMemorySettings(damagedValue);
			const { dispatcher } = buildSettingsDispatcher(settings);
			expect(await updateSettings(dispatcher, { language: 'en-US' })).toMatchObject({
				ok: false,
				error: { errorCode: 'SETTINGS_FILE_UNREADABLE', retryable: false },
			});
			expect(settings.savedValue).toEqual(damagedValue);
		},
	);

	it('gives SETTINGS_FILE_UNREADABLE and saves nothing when the load throws', async () => {
		let saveWasCalled = false;
		const settings: SettingsPort = {
			load: () => Promise.reject(new Error('disk unavailable')),
			save: () => {
				saveWasCalled = true;
				return Promise.resolve();
			},
		};
		const { dispatcher } = buildSettingsDispatcher(settings);
		expect(await updateSettings(dispatcher, { language: 'en-US' })).toMatchObject({
			error: { errorCode: 'SETTINGS_FILE_UNREADABLE' },
		});
		expect(saveWasCalled).toBe(false);
	});

	it('gives CORE_INTERNAL_ERROR, not retryable, when only the save fails, and logs it', async () => {
		const settings = {
			...createInMemorySettings(),
			save: () => Promise.reject(new Error('disk full')),
		};
		const { dispatcher, lines } = buildSettingsDispatcher(settings);
		expect(await updateSettings(dispatcher, { language: 'en-US' })).toMatchObject({
			ok: false,
			error: { errorCode: 'CORE_INTERNAL_ERROR', retryable: false },
		});
		expect(lines.some((line) => line.event === 'settings.file.write_failed')).toBe(true);
	});

	it('refuses an unknown key before the settings are read', async () => {
		let settingsWereRead = false;
		const settings: SettingsPort = {
			...createInMemorySettings(),
			load: () => {
				settingsWereRead = true;
				return Promise.resolve(null);
			},
		};
		const { dispatcher } = buildSettingsDispatcher(settings);
		expect(await updateSettings(dispatcher, { theme: 'dark' })).toMatchObject({
			error: { errorCode: 'CORE_INPUT_INVALID' },
		});
		expect(settingsWereRead).toBe(false);
	});
});
