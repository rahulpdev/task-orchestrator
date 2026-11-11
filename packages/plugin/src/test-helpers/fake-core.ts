/**
 * A real core over small in-memory adapters, for plugin unit tests. Assertions read the log
 * lines, the store files and the notices instead of spying on the core.
 *
 * @packageDocumentation
 */
import { createCore } from '@task-orchestrator/core';
import type { Core, CoreAdapters, LogEvent, StorePort } from '@task-orchestrator/core';

/** The core plus everything it wrote. */
export interface FakeCore {
	readonly core: Core;
	readonly adapters: CoreAdapters;
	readonly storeFiles: Map<string, string>;
	readonly notices: string[];
	readonly logLines: LogEvent[];
}

/**
 * Builds a store held in memory.
 *
 * @param storeFiles - The files, keyed by store path; changed in place.
 * @returns The store adapter.
 */
export function createMemoryStore(storeFiles: Map<string, string>): StorePort {
	return {
		readFile: (storePath) => {
			const contents = storeFiles.get(storePath);
			return Promise.resolve(
				contents === undefined ? { status: 'missing' } : { status: 'found', contents },
			);
		},
		writeFileAtomic: (storePath, contents) => {
			storeFiles.set(storePath, contents);
			return Promise.resolve();
		},
		appendLine: (storePath, line) => {
			storeFiles.set(storePath, `${storeFiles.get(storePath) ?? ''}${line}\n`);
			return Promise.resolve();
		},
		listFolder: () => Promise.resolve([...storeFiles.keys()]),
		deleteFile: (storePath) => {
			storeFiles.delete(storePath);
			return Promise.resolve();
		},
	};
}

/**
 * Builds a real core over in-memory adapters.
 *
 * @param fakeCoreOptions - Files the store starts with, or a store that replaces it.
 * @returns The core and what it wrote.
 */
export function createFakeCore(
	fakeCoreOptions: {
		readonly storeFiles?: Readonly<Record<string, string>>;
		readonly store?: StorePort;
	} = {},
): FakeCore {
	const storeFiles = new Map(Object.entries(fakeCoreOptions.storeFiles ?? {}));
	const notices: string[] = [];
	const logLines: LogEvent[] = [];
	const adapters: CoreAdapters = {
		vault: {
			listManaged: () => Promise.resolve([]),
			read: () => Promise.resolve(null),
			patchFrontMatter: () => Promise.resolve({ status: 'not_found' }),
			replaceContent: () => Promise.resolve({ status: 'not_found' }),
			create: () => Promise.reject(new Error('Not used by these tests.')),
			rename: () => Promise.resolve(null),
			trash: () => Promise.resolve(false),
			resolveLink: () => Promise.resolve(null),
			onChange: () => () => {
				// Nothing to unsubscribe.
			},
		},
		store: fakeCoreOptions.store ?? createMemoryStore(storeFiles),
		clock: { now: () => new Date('2026-11-10T09:30:00.000Z'), timezone: () => 'Europe/London' },
		notifier: {
			notice: (message) => {
				notices.push(message);
			},
		},
		secrets: {
			get: () => Promise.resolve(null),
			set: () => Promise.resolve({ status: 'unavailable' }),
			delete: () => Promise.resolve(),
		},
		logSink: {
			write: (logEvent) => {
				logLines.push(logEvent);
			},
		},
	};
	return { core: createCore(adapters), adapters, storeFiles, notices, logLines };
}
