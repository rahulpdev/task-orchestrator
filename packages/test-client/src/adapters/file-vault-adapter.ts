/**
 * A vault adapter over a plain folder of Markdown files, for the test client.
 *
 * Differences from the plugin's adapter, all deliberate:
 * - `create` always places the note at the vault root; the plugin follows the user's
 *   "default location for new notes" setting.
 * - `rename` renames the file only; it does not update links in other notes.
 * - `onChange` never reports anything: the test client drives the core explicitly.
 * - `deferred` is never returned, because there is no editor holding unsaved changes.
 *
 * @packageDocumentation
 */
import { access, mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
	FrontMatter,
	FrontMatterExpectation,
	FrontMatterPatch,
	NoteSnapshot,
	VaultPort,
	VaultWriteOutcome,
} from '@task-orchestrator/core';
import {
	applyFrontMatterPatch,
	joinNote,
	sanitiseTitle,
	splitNote,
	writeFileAtomically,
} from './note-file.ts';
import type { NoteFile } from './note-file.ts';

interface ManagedNote {
	readonly filePath: string;
	readonly noteId: string;
	readonly noteFile: NoteFile;
}

const TRASH_FOLDER = '.trash';

/**
 * Creates a vault adapter over a folder of Markdown files.
 *
 * @param vaultPath - The vault's root folder.
 * @returns The vault adapter.
 */
export function createFileVaultAdapter(vaultPath: string): VaultPort {
	const vaultRoot = path.resolve(vaultPath);
	const snapshotOf = (managed: ManagedNote): NoteSnapshot => toSnapshot(vaultRoot, managed);
	return {
		listManaged: async () => (await listManagedNotes(vaultRoot)).map(snapshotOf),
		read: async (noteId) => {
			const managed = await findManaged(vaultRoot, noteId);
			return managed === null
				? null
				: { ...snapshotOf(managed), body: managed.noteFile.body };
		},
		patchFrontMatter: (noteId, patch, expected) =>
			patchNote(vaultRoot, noteId, patch, expected),
		replaceContent: (noteId, newBody, expectedBody) =>
			replaceBody(vaultRoot, noteId, newBody, expectedBody),
		create: async (request) => snapshotOf(await createNote(vaultRoot, request)),
		rename: (noteId, newTitle) => renameNote(vaultRoot, noteId, newTitle),
		trash: (noteId) => trashNote(vaultRoot, noteId),
		resolveLink: (linkText) => resolveLink(vaultRoot, linkText),
		onChange: () => () => {
			// Nothing to unsubscribe: this adapter never reports changes.
		},
	};
}

function toSnapshot(vaultRoot: string, managed: ManagedNote): NoteSnapshot {
	return {
		noteId: managed.noteId,
		notePath: path.relative(vaultRoot, managed.filePath).split(path.sep).join('/'),
		frontMatter: managed.noteFile.frontMatter,
	};
}

async function patchNote(
	vaultRoot: string,
	noteId: string,
	patch: FrontMatterPatch,
	expected: FrontMatterExpectation,
): Promise<VaultWriteOutcome> {
	const managed = await findManaged(vaultRoot, noteId);
	if (managed === null) {
		return { status: 'not_found' };
	}
	const applied = applyFrontMatterPatch(managed.noteFile.frontMatter, patch, expected);
	if (applied.outcome.status === 'written' && applied.outcome.appliedFields.length > 0) {
		await writeFileAtomically(
			managed.filePath,
			joinNote(applied.frontMatter, managed.noteFile.body),
		);
	}
	return applied.outcome;
}

async function renameNote(
	vaultRoot: string,
	noteId: string,
	newTitle: string,
): Promise<NoteSnapshot | null> {
	const managed = await findManaged(vaultRoot, noteId);
	if (managed === null) {
		return null;
	}
	const targetPath = await freeFilePath(path.dirname(managed.filePath), sanitiseTitle(newTitle));
	await rename(managed.filePath, targetPath);
	return toSnapshot(vaultRoot, { ...managed, filePath: targetPath });
}

async function resolveLink(vaultRoot: string, linkText: string): Promise<NoteSnapshot | null> {
	const targetName = `${(linkText.split(/[#|]/)[0] ?? '').trim().toLowerCase()}.md`;
	const notes = await listManagedNotes(vaultRoot);
	const match = notes.find(
		(managed) => path.basename(managed.filePath).toLowerCase() === targetName,
	);
	return match === undefined ? null : toSnapshot(vaultRoot, match);
}

async function listManagedNotes(vaultRoot: string): Promise<ManagedNote[]> {
	const entries = await readdir(vaultRoot, { withFileTypes: true, recursive: true });
	const managedNotes: ManagedNote[] = [];
	for (const entry of entries) {
		const filePath = path.join(entry.parentPath, entry.name);
		const insideDotFolder = path
			.relative(vaultRoot, filePath)
			.split(path.sep)
			.some((segment) => segment.startsWith('.'));
		if (!entry.isFile() || !entry.name.endsWith('.md') || insideDotFolder) {
			continue;
		}
		const noteFile = splitNote(await readFile(filePath, 'utf8'));
		const noteId = noteFile.frontMatter.id;
		if (typeof noteId === 'string') {
			managedNotes.push({ filePath, noteId, noteFile });
		}
	}
	return managedNotes;
}

async function findManaged(vaultRoot: string, noteId: string): Promise<ManagedNote | null> {
	const notes = await listManagedNotes(vaultRoot);
	return notes.find((managed) => managed.noteId === noteId) ?? null;
}

async function replaceBody(
	vaultRoot: string,
	noteId: string,
	newBody: string,
	expectedBody: string,
): ReturnType<VaultPort['replaceContent']> {
	const managed = await findManaged(vaultRoot, noteId);
	if (managed === null) {
		return { status: 'not_found' };
	}
	if (managed.noteFile.body !== expectedBody) {
		return { status: 'written', appliedFields: [], conflictingFields: ['body'] };
	}
	await writeFileAtomically(managed.filePath, joinNote(managed.noteFile.frontMatter, newBody));
	return { status: 'written', appliedFields: ['body'], conflictingFields: [] };
}

async function createNote(
	vaultRoot: string,
	request: { readonly title: string; readonly frontMatter: FrontMatter; readonly body: string },
): Promise<ManagedNote> {
	const noteId = request.frontMatter.id;
	if (typeof noteId !== 'string') {
		throw new Error('A new note needs a string id in its front matter.');
	}
	const filePath = await freeFilePath(vaultRoot, sanitiseTitle(request.title));
	await writeFile(filePath, joinNote(request.frontMatter, request.body), {
		encoding: 'utf8',
		flag: 'wx',
	});
	return { filePath, noteId, noteFile: { frontMatter: request.frontMatter, body: request.body } };
}

async function trashNote(vaultRoot: string, noteId: string): Promise<boolean> {
	const managed = await findManaged(vaultRoot, noteId);
	if (managed === null) {
		return false;
	}
	const trashFolder = path.join(vaultRoot, TRASH_FOLDER);
	await mkdir(trashFolder, { recursive: true });
	const baseName = path.basename(managed.filePath, '.md');
	await rename(managed.filePath, await freeFilePath(trashFolder, baseName));
	return true;
}

async function freeFilePath(folderPath: string, title: string): Promise<string> {
	for (let suffix = 1; ; suffix += 1) {
		const candidateTitle = suffix === 1 ? title : `${title} ${String(suffix)}`;
		const candidatePath = path.join(folderPath, `${candidateTitle}.md`);
		if (!(await pathExists(candidatePath))) {
			return candidatePath;
		}
	}
}

async function pathExists(candidatePath: string): Promise<boolean> {
	try {
		await access(candidatePath);
		return true;
	} catch {
		return false;
	}
}
