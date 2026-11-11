/**
 * A vault held in memory, for core tests. Applies the same conflict rule as every real vault
 * adapter, through `frontMatterValuesEqual`.
 *
 * @packageDocumentation
 */
import { frontMatterValuesEqual } from '../ports.ts';
import type {
	FrontMatter,
	FrontMatterExpectation,
	FrontMatterPatch,
	FrontMatterValue,
	NoteDocument,
	NoteSnapshot,
	VaultChange,
	VaultPort,
	VaultWriteOutcome,
} from '../ports.ts';

/** A note to seed the vault with. Notes without a string `id` exist but are not managed. */
export interface InMemoryNote {
	readonly notePath: string;
	readonly frontMatter: FrontMatter;
	readonly body: string;
}

/** The in-memory vault plus a view of every note, for assertions. */
export interface InMemoryVault extends VaultPort {
	/**
	 * Lists every note, managed or not.
	 *
	 * @returns The current notes, keyed by path.
	 */
	allNotes(): ReadonlyMap<string, InMemoryNote>;
}

interface VaultState {
	readonly notes: Map<string, InMemoryNote>;
	readonly listeners: Set<(vaultChange: VaultChange) => void>;
}

/**
 * Creates a vault held in memory.
 *
 * @param seedNotes - The notes the vault starts with.
 * @returns A vault adapter whose writes change only the in-memory notes.
 */
export function createInMemoryVault(seedNotes: readonly InMemoryNote[] = []): InMemoryVault {
	const state: VaultState = {
		notes: new Map(seedNotes.map((note) => [note.notePath, note])),
		listeners: new Set(),
	};
	return {
		allNotes: () => new Map(state.notes),
		listManaged: () => Promise.resolve([...state.notes.values()].flatMap(toSnapshots)),
		read: (noteId) => Promise.resolve(readNote(state, noteId)),
		patchFrontMatter: (noteId, patch, expected) =>
			Promise.resolve(patchNote(state, noteId, patch, expected)),
		replaceContent: (noteId, newBody, expectedBody) =>
			Promise.resolve(replaceBody(state, noteId, newBody, expectedBody)),
		create: (request) =>
			new Promise((resolve) => {
				resolve(createNote(state, request));
			}),
		rename: (noteId, newTitle) => Promise.resolve(renameNote(state, noteId, newTitle)),
		trash: (noteId) => Promise.resolve(trashNote(state, noteId)),
		resolveLink: (linkText) => Promise.resolve(resolveLink(state, linkText)),
		onChange: (listener) => {
			state.listeners.add(listener);
			return () => {
				state.listeners.delete(listener);
			};
		},
	};
}

/**
 * Applies a patch field by field: each field is set (or removed for `null`) only when the
 * expectation is absent or still holds; the others are reported as conflicts.
 *
 * @param frontMatter - The current front matter.
 * @param patch - Fields to set; `null` removes a field.
 * @param expected - The value each field should hold now; `null` means absent.
 * @returns The new front matter and the write outcome.
 */
export function applyPatch(
	frontMatter: FrontMatter,
	patch: FrontMatterPatch,
	expected: FrontMatterExpectation,
): { readonly frontMatter: FrontMatter; readonly outcome: VaultWriteOutcome } {
	const updated = new Map<string, FrontMatterValue>(Object.entries(frontMatter));
	const appliedFields: string[] = [];
	const conflictingFields: string[] = [];
	for (const [fieldName, newValue] of Object.entries(patch)) {
		const expectedValue = expected[fieldName];
		if (
			expectedValue !== undefined &&
			!frontMatterValuesEqual(updated.get(fieldName), expectedValue)
		) {
			conflictingFields.push(fieldName);
			continue;
		}
		if (newValue === null) {
			updated.delete(fieldName);
		} else {
			updated.set(fieldName, newValue);
		}
		appliedFields.push(fieldName);
	}
	return {
		frontMatter: Object.fromEntries(updated),
		outcome: { status: 'written', appliedFields, conflictingFields },
	};
}

function emit(state: VaultState, vaultChange: VaultChange): void {
	for (const listener of state.listeners) {
		listener(vaultChange);
	}
}

function findNote(state: VaultState, noteId: string): InMemoryNote | undefined {
	return [...state.notes.values()].find((note) => note.frontMatter.id === noteId);
}

function replaceNote(state: VaultState, previous: InMemoryNote, next: InMemoryNote): void {
	state.notes.delete(previous.notePath);
	state.notes.set(next.notePath, next);
}

function freePath(state: VaultState, folder: string, title: string): string {
	for (let suffix = 1; ; suffix += 1) {
		const candidateTitle = suffix === 1 ? title : `${title} ${String(suffix)}`;
		const candidatePath =
			folder === '' ? `${candidateTitle}.md` : `${folder}/${candidateTitle}.md`;
		if (!state.notes.has(candidatePath)) {
			return candidatePath;
		}
	}
}

function readNote(state: VaultState, noteId: string): NoteDocument | null {
	const note = findNote(state, noteId);
	const snapshot = note === undefined ? undefined : toSnapshots(note)[0];
	return note === undefined || snapshot === undefined ? null : { ...snapshot, body: note.body };
}

function patchNote(
	state: VaultState,
	noteId: string,
	patch: FrontMatterPatch,
	expected: FrontMatterExpectation,
): VaultWriteOutcome {
	const note = findNote(state, noteId);
	if (note === undefined) {
		return { status: 'not_found' };
	}
	const applied = applyPatch(note.frontMatter, patch, expected);
	replaceNote(state, note, { ...note, frontMatter: applied.frontMatter });
	emit(state, { changeKind: 'changed', notePath: note.notePath });
	return applied.outcome;
}

function replaceBody(
	state: VaultState,
	noteId: string,
	newBody: string,
	expectedBody: string,
): VaultWriteOutcome {
	const note = findNote(state, noteId);
	if (note === undefined) {
		return { status: 'not_found' };
	}
	if (note.body !== expectedBody) {
		return { status: 'written', appliedFields: [], conflictingFields: ['body'] };
	}
	replaceNote(state, note, { ...note, body: newBody });
	emit(state, { changeKind: 'changed', notePath: note.notePath });
	return { status: 'written', appliedFields: ['body'], conflictingFields: [] };
}

function createNote(
	state: VaultState,
	request: { readonly title: string; readonly frontMatter: FrontMatter; readonly body: string },
): NoteSnapshot {
	const noteId = request.frontMatter.id;
	if (typeof noteId !== 'string') {
		throw new Error('A new note needs a string id in its front matter.');
	}
	const notePath = freePath(state, '', request.title);
	state.notes.set(notePath, { notePath, frontMatter: request.frontMatter, body: request.body });
	return { noteId, notePath, frontMatter: request.frontMatter };
}

function renameNote(state: VaultState, noteId: string, newTitle: string): NoteSnapshot | null {
	const note = findNote(state, noteId);
	if (note === undefined) {
		return null;
	}
	const slashIndex = note.notePath.lastIndexOf('/');
	const folder = slashIndex === -1 ? '' : note.notePath.slice(0, slashIndex);
	const renamed = { ...note, notePath: freePath(state, folder, newTitle) };
	replaceNote(state, note, renamed);
	emit(state, {
		changeKind: 'renamed',
		notePath: renamed.notePath,
		previousNotePath: note.notePath,
	});
	return { noteId, notePath: renamed.notePath, frontMatter: renamed.frontMatter };
}

function trashNote(state: VaultState, noteId: string): boolean {
	const note = findNote(state, noteId);
	if (note === undefined) {
		return false;
	}
	state.notes.delete(note.notePath);
	emit(state, { changeKind: 'deleted', notePath: note.notePath });
	return true;
}

function resolveLink(state: VaultState, linkText: string): NoteSnapshot | null {
	const targetName = (linkText.split(/[#|]/)[0] ?? '').trim().toLowerCase();
	for (const note of state.notes.values()) {
		const fileName = note.notePath.slice(note.notePath.lastIndexOf('/') + 1);
		if (fileName.toLowerCase() === `${targetName}.md`) {
			return toSnapshots(note)[0] ?? null;
		}
	}
	return null;
}

function toSnapshots(note: InMemoryNote): NoteSnapshot[] {
	const noteId = note.frontMatter.id;
	return typeof noteId === 'string'
		? [{ noteId, notePath: note.notePath, frontMatter: note.frontMatter }]
		: [];
}
