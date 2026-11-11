import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createPretendClock } from './adapters/clock-adapter.ts';
import { createMemoryLogSink } from './adapters/log-sink-adapter.ts';
import { createTestClient } from './index.ts';
import { copyFixtureVault } from './test-helpers/vault-copy.ts';

let vaultPath = '';
let removeCopy: () => Promise<void> = () => Promise.resolve();

beforeEach(async () => {
	({ vaultPath, removeCopy } = await copyFixtureVault());
});

afterEach(async () => {
	await removeCopy();
});

describe('the test client against a copy of the fixture vault', () => {
	it('pings, saves a language and reads it back', async () => {
		const logSink = createMemoryLogSink();
		const clock = createPretendClock('2026-11-10T09:30:00.000Z');
		const { core, notices } = createTestClient(vaultPath, { logSink, clock });

		const ping = await core.execute({ name: 'ping', version: 1, actor: 'user', payload: {} });
		expect(ping).toMatchObject({
			ok: true,
			outcome: { respondedAt: '2026-11-10T09:30:00.000Z' },
		});

		const update = await core.execute({
			name: 'updateSettings',
			version: 1,
			actor: 'user',
			payload: { language: 'en-US' },
		});
		expect(update.ok).toBe(true);
		const savedText = await readFile(
			path.join(vaultPath, '.task-orchestrator', 'settings.json'),
			'utf8',
		);
		expect(savedText).toContain('"language": "en-US"');

		const settings = await core.query({
			name: 'settings',
			version: 1,
			actor: 'user',
			payload: {},
		});
		expect(settings.ok && settings.outcome.settings.language).toBe('en-US');
		expect(notices).toEqual([]);
		expect(logSink.lines.every((line) => typeof line.correlationId === 'string')).toBe(true);
	});
});
