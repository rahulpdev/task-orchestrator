import { describe, expect, it } from 'vitest';
import { createInMemoryVault } from './in-memory-vault.ts';
import type { VaultChange } from '../ports.ts';

const PROJECT_NOTE = {
	notePath: 'Projects/Kitchen.md',
	frontMatter: { id: 'note-1', type: 'project', tags: ['home', 'diy'] },
	body: 'Paint the walls.',
};
const UNMANAGED_NOTE = { notePath: 'Loose.md', frontMatter: { type: 'reference' }, body: '' };

describe('createInMemoryVault', () => {
	it('lists only notes with a string id and reads one with its body', async () => {
		const vault = createInMemoryVault([PROJECT_NOTE, UNMANAGED_NOTE]);
		expect((await vault.listManaged()).map((note) => note.noteId)).toEqual(['note-1']);
		expect(await vault.read('note-1')).toMatchObject({ body: 'Paint the walls.' });
		expect(await vault.read('missing')).toBeNull();
	});

	it('treats an expected null as "field absent"', async () => {
		const vault = createInMemoryVault([PROJECT_NOTE]);
		const outcome = await vault.patchFrontMatter(
			'note-1',
			{ status: 'active' },
			{ status: null },
		);
		expect(outcome).toEqual({
			status: 'written',
			appliedFields: ['status'],
			conflictingFields: [],
		});
	});

	it('applies the matching field and reports the conflicting one', async () => {
		const vault = createInMemoryVault([PROJECT_NOTE]);
		const outcome = await vault.patchFrontMatter(
			'note-1',
			{ type: 'area', tags: ['diy'] },
			{ type: 'project', tags: ['diy', 'home'] },
		);
		expect(outcome).toEqual({
			status: 'written',
			appliedFields: ['type'],
			conflictingFields: ['tags'],
		});
		expect((await vault.read('note-1'))?.frontMatter).toMatchObject({
			type: 'area',
			tags: ['home', 'diy'],
		});
	});

	it('removes a field patched to null and reports not_found for a missing note', async () => {
		const vault = createInMemoryVault([PROJECT_NOTE]);
		await vault.patchFrontMatter('note-1', { tags: null }, {});
		expect((await vault.read('note-1'))?.frontMatter).not.toHaveProperty('tags');
		expect(await vault.patchFrontMatter('missing', {}, {})).toEqual({ status: 'not_found' });
	});

	it('replaces the body only when it still matches', async () => {
		const vault = createInMemoryVault([PROJECT_NOTE]);
		expect(await vault.replaceContent('note-1', 'New.', 'Old.')).toMatchObject({
			conflictingFields: ['body'],
		});
		expect(await vault.replaceContent('note-1', 'New.', 'Paint the walls.')).toMatchObject({
			appliedFields: ['body'],
		});
		expect(await vault.replaceContent('missing', 'x', 'y')).toEqual({ status: 'not_found' });
	});

	it('creates notes at the root, avoiding a taken title, and refuses a note without an id', async () => {
		const vault = createInMemoryVault();
		const first = await vault.create({ title: 'Idea', frontMatter: { id: 'a' }, body: '' });
		const second = await vault.create({ title: 'Idea', frontMatter: { id: 'b' }, body: '' });
		expect([first.notePath, second.notePath]).toEqual(['Idea.md', 'Idea 2.md']);
		await expect(vault.create({ title: 'No id', frontMatter: {}, body: '' })).rejects.toThrow();
	});

	it('renames within the folder, trashes, resolves links and reports changes', async () => {
		const vault = createInMemoryVault([PROJECT_NOTE]);
		const changes: VaultChange[] = [];
		const unsubscribe = vault.onChange((vaultChange) => changes.push(vaultChange));
		expect((await vault.rename('note-1', 'Bathroom'))?.notePath).toBe('Projects/Bathroom.md');
		expect((await vault.resolveLink('bathroom#Plan|the plan', 'Other.md'))?.noteId).toBe(
			'note-1',
		);
		expect(await vault.resolveLink('Nowhere', 'Other.md')).toBeNull();
		expect(await vault.trash('note-1')).toBe(true);
		unsubscribe();
		expect(await vault.trash('note-1')).toBe(false);
		expect(await vault.rename('note-1', 'Again')).toBeNull();
		expect(changes.map((vaultChange) => vaultChange.changeKind)).toEqual([
			'renamed',
			'deleted',
		]);
		expect(vault.allNotes().size).toBe(0);
	});
});
