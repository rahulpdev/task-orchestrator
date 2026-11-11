/**
 * Test adapters for every port. Every core test uses these; the core's public entry point does
 * not export them.
 *
 * @packageDocumentation
 */
import type { CoreAdapters } from '../ports.ts';
import { createInMemoryStore } from './in-memory-store.ts';
import { createInMemoryVault } from './in-memory-vault.ts';
import {
	createInMemorySecrets,
	createPretendClock,
	createRecordingLogSink,
	createRecordingNotifier,
} from './simple-adapters.ts';

export { applyPatch, createInMemoryVault } from './in-memory-vault.ts';
export type { InMemoryNote, InMemoryVault } from './in-memory-vault.ts';
export { createInMemoryStore } from './in-memory-store.ts';
export type { InMemoryStore } from './in-memory-store.ts';
export {
	createInMemorySecrets,
	createPretendClock,
	createRecordingLogSink,
	createRecordingNotifier,
} from './simple-adapters.ts';
export type {
	InMemorySecrets,
	PretendClock,
	RecordingLogSink,
	RecordingNotifier,
} from './simple-adapters.ts';

/**
 * Builds a full set of in-memory adapters, replacing any the test supplies.
 *
 * @param overrides - Adapters the test wants to hold on to or replace.
 * @returns One adapter per port.
 */
export function createTestAdapters(overrides: Partial<CoreAdapters> = {}): CoreAdapters {
	return {
		vault: createInMemoryVault(),
		store: createInMemoryStore(),
		clock: createPretendClock(),
		notifier: createRecordingNotifier(),
		secrets: createInMemorySecrets(),
		logSink: createRecordingLogSink(),
		...overrides,
	};
}
