import { describe, expect, it } from 'vitest';
import { createDispatcher, createOperationRegistry } from '../core/api.ts';
import type { Dispatcher } from '../core/api.ts';
import { createLogger } from '../core/logging.ts';
import type { LogEvent } from '../core/logging.ts';
import type { StorePort } from '../core/ports.ts';
import {
	createInMemoryStore,
	createPretendClock,
	createRecordingLogSink,
	createTestAdapters,
} from '../core/testing/index.ts';
import { settingsOperations } from './index.ts';

function buildSettingsDispatcher(store: StorePort): {
	readonly dispatcher: Dispatcher;
	readonly lines: LogEvent[];
} {
	const logSink = createRecordingLogSink();
	const clock = createPretendClock();
	const adapters = createTestAdapters({ store, logSink, clock });
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

function throwingStore(): StorePort {
	const fail = () => Promise.reject(new Error('disk unavailable'));
	return {
		readFile: fail,
		writeFileAtomic: fail,
		appendLine: fail,
		listFolder: fail,
		deleteFile: fail,
	};
}

describe('the settings query', () => {
	it('gives the defaults and defaulted when the file is missing', async () => {
		const { dispatcher } = buildSettingsDispatcher(createInMemoryStore());
		expect(await readSettings(dispatcher)).toMatchObject({
			ok: true,
			outcome: { settings: { language: 'en-GB' }, loadStatus: 'defaulted' },
		});
	});

	it('reads a saved language', async () => {
		const store = createInMemoryStore({ 'settings.json': '{"language":"en-US"}' });
		const { dispatcher } = buildSettingsDispatcher(store);
		expect(await readSettings(dispatcher)).toMatchObject({
			ok: true,
			outcome: { settings: { language: 'en-US' }, loadStatus: 'valid' },
		});
	});

	it('gives the defaults and corrupt for a damaged file, and logs it', async () => {
		const store = createInMemoryStore({ 'settings.json': '{ not json' });
		const { dispatcher, lines } = buildSettingsDispatcher(store);
		expect(await readSettings(dispatcher)).toMatchObject({
			outcome: { loadStatus: 'corrupt' },
		});
		expect(lines.some((line) => line.event === 'settings.file.load_rejected')).toBe(true);
	});

	it('gives CORE_STORE_UNAVAILABLE when the store throws', async () => {
		const { dispatcher } = buildSettingsDispatcher(throwingStore());
		expect(await readSettings(dispatcher)).toMatchObject({
			ok: false,
			error: { errorCode: 'CORE_STORE_UNAVAILABLE', retryable: true },
		});
	});
});

describe('the updateSettings operation', () => {
	it('writes the file, and a following query returns the new value', async () => {
		const store = createInMemoryStore();
		const { dispatcher, lines } = buildSettingsDispatcher(store);
		expect(await updateSettings(dispatcher, { language: 'en-US' })).toMatchObject({ ok: true });
		expect(store.files.get('settings.json')).toBe(
			'{\n\t"language": "en-US",\n\t"appliedSettingsMigrations": [],\n\t"minimumLogLevel": "info"\n}\n',
		);
		expect(await readSettings(dispatcher)).toMatchObject({
			outcome: { settings: { language: 'en-US' } },
		});
		const updateLine = lines.find((line) => line.event === 'settings.file.update_completed');
		expect(updateLine?.changedSettingNames).toEqual(['language']);
	});

	it('refuses to overwrite a corrupt file and leaves it byte-for-byte unchanged', async () => {
		const store = createInMemoryStore({ 'settings.json': '{ not json' });
		const { dispatcher } = buildSettingsDispatcher(store);
		expect(await updateSettings(dispatcher, { language: 'en-US' })).toMatchObject({
			ok: false,
			error: { errorCode: 'SETTINGS_FILE_UNREADABLE', retryable: false },
		});
		expect(store.files.get('settings.json')).toBe('{ not json');
	});

	it('gives CORE_STORE_UNAVAILABLE when the store throws', async () => {
		const { dispatcher } = buildSettingsDispatcher(throwingStore());
		expect(await updateSettings(dispatcher, { language: 'en-US' })).toMatchObject({
			error: { errorCode: 'CORE_STORE_UNAVAILABLE' },
		});
	});

	it('gives CORE_STORE_UNAVAILABLE when only the write fails', async () => {
		const store = {
			...createInMemoryStore(),
			writeFileAtomic: () => Promise.reject(new Error('disk full')),
		};
		const { dispatcher } = buildSettingsDispatcher(store);
		expect(await updateSettings(dispatcher, { language: 'en-US' })).toMatchObject({
			error: { errorCode: 'CORE_STORE_UNAVAILABLE' },
		});
	});

	it('refuses an unknown key before the store is read', async () => {
		let storeWasRead = false;
		const store: StorePort = {
			...createInMemoryStore(),
			readFile: () => {
				storeWasRead = true;
				return Promise.resolve({ status: 'missing' });
			},
		};
		const { dispatcher } = buildSettingsDispatcher(store);
		expect(await updateSettings(dispatcher, { theme: 'dark' })).toMatchObject({
			error: { errorCode: 'CORE_INPUT_INVALID' },
		});
		expect(storeWasRead).toBe(false);
	});
});
