/**
 * Builds one Obsidian adapter per port.
 *
 * @packageDocumentation
 */
import type { Plugin } from 'obsidian';
import type { CoreAdapters, Logger, LogLevel } from '@task-orchestrator/core';
import { createObsidianClockAdapter } from './clock-adapter.ts';
import { createObsidianLogSink } from './log-sink-adapter.ts';
import { createObsidianNotifierAdapter } from './notifier-adapter.ts';
import { readOpenEditorTexts } from './open-editors.ts';
import { createObsidianSecretsAdapter } from './secrets-adapter.ts';
import { createObsidianStoreAdapter } from './store-adapter.ts';
import { createObsidianVaultAdapter } from './vault-adapter.ts';
import { createPerFileWriteQueue } from './write-queue.ts';

/** The adapters plus a way to wait for pending log writes. */
export interface ObsidianAdapters {
	readonly adapters: CoreAdapters;
	/**
	 * Waits until every pending log line has been written to the store.
	 *
	 * @returns A promise that settles once the log is written.
	 */
	flushLog(): Promise<void>;
}

/** What the adapters need that only the plugin knows. */
export interface AdapterOptions {
	/** The minimum log level from the user's current settings, read on every log line. */
	readonly currentMinimumLevel: () => LogLevel;
	/** The core's logger, once the core exists. */
	readonly getLogger: () => Logger | null;
}

/**
 * Builds every adapter from the plugin, never from the global `app`.
 *
 * @param plugin - The plugin instance; its `app` and `registerEvent` are used.
 * @param adapterOptions - Minimum log level and logger access.
 * @returns The six adapters and the log flush.
 */
export function createObsidianAdapters(
	plugin: Plugin,
	adapterOptions: AdapterOptions,
): ObsidianAdapters {
	const { app } = plugin;
	const store = createObsidianStoreAdapter(app.vault.adapter);
	const logSink = createObsidianLogSink(store, adapterOptions.currentMinimumLevel);
	const vault = createObsidianVaultAdapter({
		host: {
			vault: app.vault,
			metadataCache: app.metadataCache,
			fileManager: app.fileManager,
			readOpenEditorTexts: (file) => readOpenEditorTexts(app.workspace, file),
		},
		registerEvent: (eventRef) => {
			plugin.registerEvent(eventRef);
		},
		writeQueue: createPerFileWriteQueue(),
		getLogger: adapterOptions.getLogger,
	});
	return {
		adapters: {
			vault,
			store,
			clock: createObsidianClockAdapter(),
			notifier: createObsidianNotifierAdapter(),
			secrets: createObsidianSecretsAdapter(app),
			logSink,
		},
		flushLog: () => logSink.flush(),
	};
}
