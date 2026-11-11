/**
 * The test client: drives the application core against a folder of Markdown files, with no
 * host application involved.
 *
 * @packageDocumentation
 */
import { createCore } from '@task-orchestrator/core';
import type { ClockPort, Core, LogLevel, LogSink } from '@task-orchestrator/core';
import { createSystemClock } from './adapters/clock-adapter.ts';
import { createFileStoreAdapter } from './adapters/file-store-adapter.ts';
import { createFileVaultAdapter } from './adapters/file-vault-adapter.ts';
import { createStderrLogSink } from './adapters/log-sink-adapter.ts';
import { createMemorySecretsAdapter } from './adapters/memory-secrets-adapter.ts';
import { createPrintingNotifier } from './adapters/printing-notifier-adapter.ts';

/** Settings for {@link createTestClient}. */
export interface TestClientOptions {
	/** Defaults to the system clock. */
	readonly clock?: ClockPort;
	/** Defaults to `info`. */
	readonly minimumLogLevel?: LogLevel;
	/** Defaults to JSON lines on standard error. */
	readonly logSink?: LogSink;
}

/** A core wired to file-based adapters, plus every notice it has shown. */
export interface TestClient {
	readonly core: Core;
	readonly notices: readonly string[];
}

/**
 * Wires every file-based adapter into a new core.
 *
 * @param vaultPath - The vault folder to work on.
 * @param testClientOptions - Clock, minimum log level and log sink.
 * @returns The core and the notices it shows.
 */
export function createTestClient(
	vaultPath: string,
	testClientOptions: TestClientOptions = {},
): TestClient {
	const notifier = createPrintingNotifier();
	const core = createCore(
		{
			vault: createFileVaultAdapter(vaultPath),
			store: createFileStoreAdapter(vaultPath),
			clock: testClientOptions.clock ?? createSystemClock(),
			notifier,
			secrets: createMemorySecretsAdapter(),
			logSink: testClientOptions.logSink ?? createStderrLogSink(),
		},
		{ minimumLogLevel: testClientOptions.minimumLogLevel ?? 'info' },
	);
	return { core, notices: notifier.shownNotices };
}
