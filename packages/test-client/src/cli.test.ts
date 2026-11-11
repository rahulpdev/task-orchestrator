import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copyFixtureVault } from './test-helpers/vault-copy.ts';

const CLI_PATH = path.resolve(import.meta.dirname, 'cli.ts');

let vaultPath = '';
let removeCopy: () => Promise<void> = () => Promise.resolve();

beforeEach(async () => {
	({ vaultPath, removeCopy } = await copyFixtureVault());
});

afterEach(async () => {
	await removeCopy();
});

function runCli(cliArguments: readonly string[]): {
	readonly exitCode: number | null;
	readonly stdout: string;
	readonly stderr: string;
} {
	const run = spawnSync(process.execPath, [CLI_PATH, ...cliArguments], { encoding: 'utf8' });
	return { exitCode: run.status, stdout: run.stdout, stderr: run.stderr };
}

function correlationIdOf(stdout: string): unknown {
	const result: unknown = JSON.parse(stdout);
	return typeof result === 'object' && result !== null && 'correlationId' in result
		? result.correlationId
		: undefined;
}

describe('the test client command line', () => {
	it('runs ping and exits 0', () => {
		const run = runCli([vaultPath, 'ping']);
		expect(run.exitCode).toBe(0);
		expect(JSON.parse(run.stdout)).toMatchObject({ ok: true });
	});

	it('runs the settings query, falling back from execute to query, and exits 0', () => {
		const run = runCli([vaultPath, 'settings']);
		expect(run.exitCode).toBe(0);
		expect(JSON.parse(run.stdout)).toMatchObject({ outcome: { loadStatus: 'defaulted' } });
	});

	it('saves a setting, and every log line carries the result correlation ID', async () => {
		const run = runCli([vaultPath, 'updateSettings', '{"language":"en-US"}']);
		expect(run.exitCode).toBe(0);
		const saved = await readFile(
			path.join(vaultPath, '.task-orchestrator', 'settings.json'),
			'utf8',
		);
		expect(saved).toContain('"language": "en-US"');
		const correlationId = correlationIdOf(run.stdout);
		const logLines = run.stderr
			.trim()
			.split('\n')
			.map((line): unknown => JSON.parse(line));
		expect(logLines.length).toBeGreaterThan(0);
		for (const logLine of logLines) {
			expect(logLine).toMatchObject({ correlationId });
		}
	});

	it('exits 1 when the result is not ok', () => {
		const run = runCli([vaultPath, 'updateSettings', '{"theme":"dark"}']);
		expect(run.exitCode).toBe(1);
		expect(JSON.parse(run.stdout)).toMatchObject({
			error: { errorCode: 'CORE_INPUT_INVALID' },
		});
	});

	it.each([
		['bad JSON', ['ping', '{not json']],
		['a missing operation name', []],
		['a bad version', ['ping', '--version', '0']],
		['a bad log level', ['ping', '--log-level', 'loud']],
	])('exits 2 with usage for %s', (_label, extraArguments) => {
		const run = runCli([vaultPath, ...extraArguments]);
		expect(run.exitCode).toBe(2);
		expect(run.stderr).toContain('Usage:');
		expect(run.stdout).toBe('');
	});

	it('exits 2 when the vault path is not a folder', () => {
		expect(runCli([path.join(vaultPath, 'missing-folder'), 'ping']).exitCode).toBe(2);
	});
});
