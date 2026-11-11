import { TFile, TFolder } from 'obsidian';
import type { CachedMetadata, EventRef } from 'obsidian';
import { describe, expect, it } from 'vitest';
import { createObsidianVaultAdapter } from './vault-adapter.ts';
import type { VaultAdapterHost } from './vault-adapter.ts';
import { createPerFileWriteQueue } from './write-queue.ts';

const NOTE_ID = 'note-1';
const EVENT_REF: EventRef = {};

interface FakeVault {
	readonly host: VaultAdapterHost;
	readonly file: TFile;
	readonly frontMatter: Record<string, unknown>;
	readonly texts: Map<string, string>;
}

function createFakeVault(openEditorTexts: readonly string[] = []): FakeVault {
	const file = new TFile();
	file.path = 'Projects/Kitchen.md';
	const frontMatter: Record<string, unknown> = {
		id: NOTE_ID,
		type: 'project',
		tags: ['home', 'diy'],
	};
	const texts = new Map([[file.path, '---\nid: note-1\n---\nPaint the walls.\n']]);
	const rootFolder = new TFolder();
	const host: VaultAdapterHost = {
		vault: {
			getMarkdownFiles: () => [file],
			cachedRead: (readFile) => Promise.resolve(texts.get(readFile.path) ?? ''),
			read: (readFile) => Promise.resolve(texts.get(readFile.path) ?? ''),
			process: (processedFile, transform) => {
				const next = transform(texts.get(processedFile.path) ?? '');
				texts.set(processedFile.path, next);
				return Promise.resolve(next);
			},
			create: (filePath, data) => {
				const created = new TFile();
				created.path = filePath;
				texts.set(filePath, data);
				return Promise.resolve(created);
			},
			getFileByPath: (filePath) => (texts.has(filePath) ? file : null),
			on: () => EVENT_REF,
			offref: () => undefined,
		},
		metadataCache: {
			getFileCache: (): CachedMetadata => ({ frontmatter: { ...frontMatter } }),
			getFirstLinkpathDest: (linkPath) => (linkPath === 'Kitchen' ? file : null),
			on: () => EVENT_REF,
			offref: () => undefined,
		},
		fileManager: {
			processFrontMatter: (
				targetFile,
				mutate: (rawFrontMatter: Record<string, unknown>) => void,
			) => {
				mutate(targetFile === file ? frontMatter : {});
				return Promise.resolve();
			},
			getNewFileParent: () => rootFolder,
			renameFile: (renamedFile, newPath) => {
				renamedFile.path = newPath;
				return Promise.resolve();
			},
			trashFile: () => Promise.resolve(),
		},
		readOpenEditorTexts: () => openEditorTexts,
	};
	return { host, file, frontMatter, texts };
}

function createAdapter(fakeVault: FakeVault) {
	return createObsidianVaultAdapter({
		host: fakeVault.host,
		registerEvent: () => undefined,
		writeQueue: createPerFileWriteQueue(),
		getLogger: () => null,
	});
}

describe('patchFrontMatter', () => {
	it('treats an expected null as "field absent"', async () => {
		const fakeVault = createFakeVault();
		const outcome = await createAdapter(fakeVault).patchFrontMatter(
			NOTE_ID,
			{ status: 'active' },
			{ status: null },
		);
		expect(outcome).toEqual({
			status: 'written',
			appliedFields: ['status'],
			conflictingFields: [],
		});
		expect(fakeVault.frontMatter.status).toBe('active');
	});

	it('treats an array that differs only in order as a conflict', async () => {
		const fakeVault = createFakeVault();
		const outcome = await createAdapter(fakeVault).patchFrontMatter(
			NOTE_ID,
			{ tags: ['diy'] },
			{ tags: ['diy', 'home'] },
		);
		expect(outcome).toEqual({
			status: 'written',
			appliedFields: [],
			conflictingFields: ['tags'],
		});
		expect(fakeVault.frontMatter.tags).toEqual(['home', 'diy']);
	});

	it('applies the matching field when the other of two conflicts', async () => {
		const fakeVault = createFakeVault();
		const outcome = await createAdapter(fakeVault).patchFrontMatter(
			NOTE_ID,
			{ type: 'area', tags: null },
			{ type: 'project', tags: ['other'] },
		);
		expect(outcome).toEqual({
			status: 'written',
			appliedFields: ['type'],
			conflictingFields: ['tags'],
		});
		expect(fakeVault.frontMatter).toMatchObject({ type: 'area', tags: ['home', 'diy'] });
	});

	it('returns deferred and writes nothing while the note is open with unsaved changes', async () => {
		const fakeVault = createFakeVault(['---\nid: note-1\n---\nUnsaved edit.\n']);
		const adapter = createAdapter(fakeVault);
		expect(await adapter.patchFrontMatter(NOTE_ID, { type: 'area' }, {})).toEqual({
			status: 'deferred',
			reason: 'open_with_unsaved_changes',
		});
		expect(await adapter.replaceContent(NOTE_ID, 'x', 'Paint the walls.\n')).toMatchObject({
			status: 'deferred',
		});
		expect(fakeVault.frontMatter.type).toBe('project');
	});

	it('writes while the note is open with no unsaved changes, and reports a missing note', async () => {
		const fakeVault = createFakeVault(['---\nid: note-1\n---\nPaint the walls.\n']);
		const adapter = createAdapter(fakeVault);
		expect(await adapter.patchFrontMatter(NOTE_ID, { type: 'area' }, {})).toMatchObject({
			appliedFields: ['type'],
		});
		expect(await adapter.patchFrontMatter('missing', {}, {})).toEqual({ status: 'not_found' });
	});
});

describe('the other vault operations', () => {
	it('lists, reads the body after the front matter and replaces it only when it matches', async () => {
		const fakeVault = createFakeVault();
		const adapter = createAdapter(fakeVault);
		expect((await adapter.listManaged()).map((note) => note.notePath)).toEqual([
			'Projects/Kitchen.md',
		]);
		expect((await adapter.read(NOTE_ID))?.body).toBe('Paint the walls.\n');
		expect(await adapter.replaceContent(NOTE_ID, 'New.\n', 'stale')).toMatchObject({
			conflictingFields: ['body'],
		});
		expect(await adapter.replaceContent(NOTE_ID, 'New.\n', 'Paint the walls.\n')).toMatchObject(
			{
				appliedFields: ['body'],
			},
		);
		expect(fakeVault.texts.get('Projects/Kitchen.md')).toBe('---\nid: note-1\n---\nNew.\n');
	});

	it('creates, renames, resolves a link and trashes', async () => {
		const fakeVault = createFakeVault();
		const adapter = createAdapter(fakeVault);
		const created = await adapter.create({
			title: 'Idea: one',
			frontMatter: { id: 'note-2' },
			body: 'Body.',
		});
		expect(created.notePath).toBe('Idea one.md');
		await expect(
			adapter.create({ title: 'No id', frontMatter: {}, body: '' }),
		).rejects.toThrow();
		expect((await adapter.rename(NOTE_ID, 'Bathroom'))?.notePath).toBe('Bathroom.md');
		expect((await adapter.resolveLink('Kitchen#Plan', 'Other.md'))?.noteId).toBe(NOTE_ID);
		expect(await adapter.resolveLink('Nowhere', 'Other.md')).toBeNull();
		expect(await adapter.trash(NOTE_ID)).toBe(true);
		expect(await adapter.trash('missing')).toBe(false);
		expect(await adapter.read('missing')).toBeNull();
		expect(await adapter.rename('missing', 'x')).toBeNull();
	});

	it('registers three events for change notifications and removes them on unsubscribe', () => {
		const fakeVault = createFakeVault();
		const registered: EventRef[] = [];
		const adapter = createObsidianVaultAdapter({
			host: fakeVault.host,
			registerEvent: (eventRef) => registered.push(eventRef),
			writeQueue: createPerFileWriteQueue(),
			getLogger: () => null,
		});
		const unsubscribe = adapter.onChange(() => undefined);
		expect(registered).toHaveLength(3);
		expect(() => {
			unsubscribe();
		}).not.toThrow();
	});
});
