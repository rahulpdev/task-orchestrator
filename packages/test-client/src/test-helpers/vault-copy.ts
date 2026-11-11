/**
 * Copies the committed `test-vault/` fixture into a fresh temporary folder, so tests never
 * change the fixture itself.
 *
 * @packageDocumentation
 */
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** The committed fixture vault at the repository root. */
export const FIXTURE_VAULT_PATH = path.resolve(import.meta.dirname, '../../../../test-vault');

/** The fixture note's front-matter `id`. */
export const FIXTURE_NOTE_ID = '6f1c2d9e-3b7a-4c1e-9f0a-2b8d4e6a1c33';

/**
 * Copies the fixture vault, leaving out any local store a development run left behind.
 *
 * @returns The copy's path and a function that deletes it.
 */
export async function copyFixtureVault(): Promise<{
	readonly vaultPath: string;
	readonly removeCopy: () => Promise<void>;
}> {
	const vaultPath = await mkdtemp(path.join(tmpdir(), 'task-orchestrator-vault-'));
	await cp(FIXTURE_VAULT_PATH, vaultPath, {
		recursive: true,
		filter: (sourcePath) => !sourcePath.includes(`${path.sep}.task-orchestrator`),
	});
	return { vaultPath, removeCopy: () => rm(vaultPath, { recursive: true, force: true }) };
}
