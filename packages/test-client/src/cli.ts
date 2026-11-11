#!/usr/bin/env node
/**
 * Command line for the test client: runs any registered operation or query against a vault
 * folder and prints its `Result` as JSON.
 *
 * Usage: `node packages/test-client/src/cli.ts <vaultPath> <operationName> [jsonPayload]
 * [--version <n>] [--log-level <level>]`
 *
 * Standard output carries only the `Result`; log lines go to standard error. Exit codes: 0 when
 * the result is `ok`, 1 when it is not, 2 for a usage error.
 *
 * @packageDocumentation
 */
import { randomUUID } from 'node:crypto';
import { stat } from 'node:fs/promises';
import process from 'node:process';
import type { LogLevel } from '@task-orchestrator/core';
import { createTestClient } from './index.ts';

interface CliArguments {
	readonly vaultPath: string;
	readonly operationName: string;
	readonly payload: unknown;
	readonly version: number;
	readonly minimumLogLevel: LogLevel;
}

const USAGE =
	'Usage: node packages/test-client/src/cli.ts <vaultPath> <operationName> [jsonPayload] [--version <n>] [--log-level <debug|info|warn|error>]';
const LOG_LEVELS: readonly string[] = ['debug', 'info', 'warn', 'error'];

/**
 * Reads the command line into arguments, or explains what is wrong with it.
 *
 * @param argumentList - The arguments after the script name.
 * @returns The arguments, or an error message for a usage error.
 */
function parseArguments(argumentList: readonly string[]): CliArguments | string {
	const positional: string[] = [];
	const flags = new Map<string, string>();
	for (let argumentIndex = 0; argumentIndex < argumentList.length; argumentIndex += 1) {
		const argument = argumentList[argumentIndex] ?? '';
		if (argument === '--version' || argument === '--log-level') {
			const flagValue = argumentList[argumentIndex + 1];
			if (flagValue === undefined) {
				return `${argument} needs a value.`;
			}
			flags.set(argument, flagValue);
			argumentIndex += 1;
		} else {
			positional.push(argument);
		}
	}
	const [vaultPath, operationName, payloadText = '{}'] = positional;
	if (vaultPath === undefined || operationName === undefined || positional.length > 3) {
		return 'Expected a vault path, an operation name and an optional JSON payload.';
	}
	const version = Number(flags.get('--version') ?? '1');
	const minimumLogLevel = flags.get('--log-level') ?? 'info';
	if (!Number.isInteger(version) || version < 1) {
		return '--version must be a whole number of at least 1.';
	}
	if (!isLogLevel(minimumLogLevel)) {
		return '--log-level must be one of debug, info, warn, error.';
	}
	let payload: unknown;
	try {
		payload = JSON.parse(payloadText);
	} catch {
		return 'The payload is not valid JSON.';
	}
	return { vaultPath, operationName, payload, version, minimumLogLevel };
}

function isLogLevel(candidate: string): candidate is LogLevel {
	return LOG_LEVELS.includes(candidate);
}

async function isFolder(folderPath: string): Promise<boolean> {
	try {
		return (await stat(folderPath)).isDirectory();
	} catch {
		return false;
	}
}

/**
 * Runs one request and sets the exit code. A request sent to `execute` that names a query is
 * sent again to `query` with the same correlation ID.
 *
 * @param argumentList - The arguments after the script name.
 * @returns A promise that settles once the result has been printed.
 */
async function main(argumentList: readonly string[]): Promise<void> {
	const cliArguments = parseArguments(argumentList);
	if (typeof cliArguments === 'string' || !(await isFolder(cliArguments.vaultPath))) {
		const problem =
			typeof cliArguments === 'string' ? cliArguments : 'The vault path is not a folder.';
		process.stderr.write(`${problem}\n${USAGE}\n`);
		process.exitCode = 2;
		return;
	}
	const { core } = createTestClient(cliArguments.vaultPath, {
		minimumLogLevel: cliArguments.minimumLogLevel,
	});
	const envelope = {
		name: cliArguments.operationName,
		version: cliArguments.version,
		actor: 'user',
		correlationId: randomUUID(),
		payload: cliArguments.payload,
	};
	let result = await core.execute(envelope);
	if (!result.ok && result.error.details?.reason === 'kind_mismatch') {
		result = await core.query(envelope);
	}
	process.stdout.write(`${JSON.stringify(result, null, '\t')}\n`);
	process.exitCode = result.ok ? 0 : 1;
}

await main(process.argv.slice(2));
