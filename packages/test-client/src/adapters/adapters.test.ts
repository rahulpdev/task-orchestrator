import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copyFixtureVault, FIXTURE_NOTE_ID } from '../test-helpers/vault-copy.ts';
import { createFileStoreAdapter } from './file-store-adapter.ts';
import { createFileVaultAdapter } from './file-vault-adapter.ts';
import { createMemorySecretsAdapter } from './memory-secrets-adapter.ts';

let vaultPath = '';
let removeCopy: () => Promise<void> = () => Promise.resolve();

beforeEach(async () => {
	({ vaultPath, removeCopy } = await copyFixtureVault());
});

afterEach(async () => {
	await removeCopy();
});

const fixtureFile = () => path.join(vaultPath, 'Fixture note.md');

describe('the file vault adapter', () => {
	it('lists the fixture note and nothing inside dot folders', async () => {
		await writeFile(path.join(vaultPath, '.obsidian', 'hidden.md'), '---\nid: hidden\n---\n');
		const managed = await createFileVaultAdapter(vaultPath).listManaged();
		expect(managed.map((note) => note.notePath)).toEqual(['Fixture note.md']);
	});

	it('reads the fixture body and front matter', async () => {
		const note = await createFileVaultAdapter(vaultPath).read(FIXTURE_NOTE_ID);
		expect(note).toMatchObject({
			noteId: FIXTURE_NOTE_ID,
			frontMatter: { type: 'reference' },
			body: 'This note is a fixture for the development vault and the automated tests.\n',
		});
	});

	it('applies a field when the expectation matches and keeps the body', async () => {
		const vault = createFileVaultAdapter(vaultPath);
		const outcome = await vault.patchFrontMatter(
			FIXTURE_NOTE_ID,
			{ type: 'project' },
			{ type: 'reference' },
		);
		expect(outcome).toEqual({
			status: 'written',
			appliedFields: ['type'],
			conflictingFields: [],
		});
		const fileText = await readFile(fixtureFile(), 'utf8');
		expect(fileText).toContain('type: project');
		expect(fileText.endsWith('automated tests.\n')).toBe(true);
	});

	it('reports a conflict and leaves the file unchanged when the expectation does not match', async () => {
		const before = await readFile(fixtureFile(), 'utf8');
		const outcome = await createFileVaultAdapter(vaultPath).patchFrontMatter(
			FIXTURE_NOTE_ID,
			{ type: 'project' },
			{ type: 'area' },
		);
		expect(outcome).toEqual({
			status: 'written',
			appliedFields: [],
			conflictingFields: ['type'],
		});
		expect(await readFile(fixtureFile(), 'utf8')).toBe(before);
	});

	it('creates a note at the root and avoids a name clash', async () => {
		const vault = createFileVaultAdapter(vaultPath);
		const created = await vault.create({
			title: 'Fixture note',
			frontMatter: { id: 'new-note' },
			body: 'Hello.\n',
		});
		expect(created.notePath).toBe('Fixture note 2.md');
		expect((await vault.read('new-note'))?.body).toBe('Hello.\n');
	});

	it('replaces the body, renames, resolves a link and trashes', async () => {
		const vault = createFileVaultAdapter(vaultPath);
		const original = await vault.read(FIXTURE_NOTE_ID);
		expect(
			await vault.replaceContent(FIXTURE_NOTE_ID, 'New body.\n', original?.body ?? ''),
		).toMatchObject({
			appliedFields: ['body'],
		});
		expect(await vault.replaceContent(FIXTURE_NOTE_ID, 'x', 'stale')).toMatchObject({
			conflictingFields: ['body'],
		});
		expect((await vault.rename(FIXTURE_NOTE_ID, 'Renamed: note'))?.notePath).toBe(
			'Renamed note.md',
		);
		expect((await vault.resolveLink('renamed note#Heading', 'Other.md'))?.noteId).toBe(
			FIXTURE_NOTE_ID,
		);
		expect(await vault.trash(FIXTURE_NOTE_ID)).toBe(true);
		expect(await readdir(path.join(vaultPath, '.trash'))).toEqual(['Renamed note.md']);
		expect(await vault.read(FIXTURE_NOTE_ID)).toBeNull();
		expect(await vault.patchFrontMatter(FIXTURE_NOTE_ID, {}, {})).toEqual({
			status: 'not_found',
		});
	});
});

describe('the file store adapter', () => {
	it('writes atomically, leaves no temporary file and reads the contents back', async () => {
		const store = createFileStoreAdapter(vaultPath);
		await store.writeFileAtomic('settings.json', '{}\n');
		expect(await store.readFile('settings.json')).toEqual({
			status: 'found',
			contents: '{}\n',
		});
		expect(await store.listFolder('')).toEqual(['settings.json']);
	});

	it('appends lines, creating folders, and reports missing files and folders', async () => {
		const store = createFileStoreAdapter(vaultPath);
		await store.appendLine('logs/application-2026-11.jsonl', '{"a":1}');
		await store.appendLine('logs/application-2026-11.jsonl', '{"a":2}');
		expect(await store.readFile('logs/application-2026-11.jsonl')).toEqual({
			status: 'found',
			contents: '{"a":1}\n{"a":2}\n',
		});
		await store.deleteFile('logs/application-2026-11.jsonl');
		expect(await store.readFile('logs/application-2026-11.jsonl')).toEqual({
			status: 'missing',
		});
		expect(await store.listFolder('nowhere')).toEqual([]);
	});

	it('refuses a path that leaves the store folder', async () => {
		await expect(
			createFileStoreAdapter(vaultPath).readFile('../Fixture note.md'),
		).rejects.toThrow(/leaves the store folder/);
	});
});

describe('the memory secrets adapter', () => {
	it('stores, reads and deletes a secret', async () => {
		const secrets = createMemorySecretsAdapter();
		expect(await secrets.set('licence-key', 'abc')).toEqual({ status: 'stored' });
		expect(await secrets.get('licence-key')).toBe('abc');
		await secrets.delete('licence-key');
		expect(await secrets.get('licence-key')).toBeNull();
	});
});
