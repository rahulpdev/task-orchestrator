/**
 * The vault adapter: the user's notes, read and written through Obsidian's own APIs.
 *
 * Front matter is changed only with `fileManager.processFrontMatter`, never hand-written YAML.
 * A note open in an editor with unsaved changes is never written: the adapter returns
 * `deferred` instead (TAD 2.4). Notes are found by front-matter `id` with a full scan until the
 * index slice exists (TAD 2.4, "The index and the checkpoint").
 *
 * @packageDocumentation
 */
import { getFrontMatterInfo, normalizePath, TFile } from 'obsidian';
import type { EventRef, FileManager, MetadataCache, Vault } from 'obsidian';
import type {
	FrontMatter,
	FrontMatterExpectation,
	FrontMatterPatch,
	Logger,
	NoteSnapshot,
	VaultChange,
	VaultPort,
	VaultWriteOutcome,
} from '@task-orchestrator/core';
import { describeError } from '../notices.ts';
import { applyPatchInPlace, toFrontMatter } from './front-matter.ts';
import type { PerFileWriteQueue } from './write-queue.ts';

/** The parts of the app the vault adapter uses. */
export interface VaultAdapterHost {
	readonly vault: Pick<
		Vault,
		| 'getMarkdownFiles'
		| 'cachedRead'
		| 'read'
		| 'process'
		| 'create'
		| 'getFileByPath'
		| 'on'
		| 'offref'
	>;
	readonly metadataCache: Pick<
		MetadataCache,
		'getFileCache' | 'getFirstLinkpathDest' | 'on' | 'offref'
	>;
	readonly fileManager: Pick<
		FileManager,
		'processFrontMatter' | 'getNewFileParent' | 'renameFile' | 'trashFile'
	>;
	/**
	 * Reads the text of every editor that has the file open, saved or not.
	 *
	 * @param file - The file to look for.
	 * @returns One text per open editor; empty when the file is not open.
	 */
	readOpenEditorTexts(file: TFile): readonly string[];
}

/** Everything the vault adapter is built from. */
export interface VaultAdapterDependencies {
	readonly host: VaultAdapterHost;
	/** Registers an event so it is removed when the plugin unloads. */
	readonly registerEvent: (eventRef: EventRef) => void;
	readonly writeQueue: PerFileWriteQueue;
	/** Returns the core's logger once the core exists. */
	readonly getLogger: () => Logger | null;
}

const DEFERRED: VaultWriteOutcome = { status: 'deferred', reason: 'open_with_unsaved_changes' };
const FORBIDDEN_TITLE_CHARACTERS = /[\\/:*?"<>|#^[\]]/g;

/**
 * Creates the vault adapter.
 *
 * @param dependencies - The app parts, event registration, write queue and logger.
 * @returns The vault adapter.
 */
export function createObsidianVaultAdapter(dependencies: VaultAdapterDependencies): VaultPort {
	const { host } = dependencies;
	return {
		listManaged: () =>
			Promise.resolve(listManagedFiles(host).map((managed) => managed.snapshot)),
		read: async (noteId) => {
			const managed = findManaged(host, noteId);
			if (managed === null) {
				return null;
			}
			const noteText = await host.vault.cachedRead(managed.file);
			return {
				...managed.snapshot,
				body: noteText.slice(getFrontMatterInfo(noteText).contentStart),
			};
		},
		patchFrontMatter: (noteId, patch, expected) =>
			patchFrontMatter(dependencies, noteId, patch, expected),
		replaceContent: (noteId, newBody, expectedBody) =>
			replaceContent(dependencies, noteId, newBody, expectedBody),
		create: (request) => createNote(host, request),
		rename: (noteId, newTitle) => renameNote(host, noteId, newTitle),
		trash: async (noteId) => {
			const managed = findManaged(host, noteId);
			if (managed !== null) {
				await host.fileManager.trashFile(managed.file);
			}
			return managed !== null;
		},
		resolveLink: (linkText, sourceNotePath) => {
			const linkPath = (linkText.split(/[#|]/)[0] ?? '').trim();
			const target = host.metadataCache.getFirstLinkpathDest(
				linkPath,
				normalizePath(sourceNotePath),
			);
			return Promise.resolve(target === null ? null : (snapshotOf(host, target) ?? null));
		},
		onChange: (listener) => subscribeToChanges(dependencies, listener),
	};
}

async function renameNote(
	host: VaultAdapterHost,
	noteId: string,
	newTitle: string,
): Promise<NoteSnapshot | null> {
	const managed = findManaged(host, noteId);
	if (managed === null) {
		return null;
	}
	const folderPath = managed.file.parent?.path ?? '';
	await host.fileManager.renameFile(managed.file, freeNotePath(host, folderPath, newTitle));
	return { ...managed.snapshot, notePath: managed.file.path };
}

interface ManagedFile {
	readonly file: TFile;
	readonly snapshot: NoteSnapshot;
}

function snapshotOf(host: VaultAdapterHost, file: TFile): NoteSnapshot | undefined {
	const frontMatter = toFrontMatter(host.metadataCache.getFileCache(file)?.frontmatter);
	const noteId = frontMatter.id;
	return typeof noteId === 'string' ? { noteId, notePath: file.path, frontMatter } : undefined;
}

function listManagedFiles(host: VaultAdapterHost): ManagedFile[] {
	return host.vault.getMarkdownFiles().flatMap((file) => {
		const snapshot = snapshotOf(host, file);
		return snapshot === undefined ? [] : [{ file, snapshot }];
	});
}

function findManaged(host: VaultAdapterHost, noteId: string): ManagedFile | null {
	return listManagedFiles(host).find((managed) => managed.snapshot.noteId === noteId) ?? null;
}

async function hasUnsavedEdits(host: VaultAdapterHost, file: TFile): Promise<boolean> {
	const editorTexts = host.readOpenEditorTexts(file);
	if (editorTexts.length === 0) {
		return false;
	}
	const diskText = await host.vault.read(file);
	return editorTexts.some((editorText) => editorText !== diskText);
}

async function patchFrontMatter(
	dependencies: VaultAdapterDependencies,
	noteId: string,
	patch: FrontMatterPatch,
	expected: FrontMatterExpectation,
): Promise<VaultWriteOutcome> {
	const { host, writeQueue } = dependencies;
	const managed = findManaged(host, noteId);
	if (managed === null) {
		return { status: 'not_found' };
	}
	return writeQueue.runExclusive(managed.file, async () => {
		if (await hasUnsavedEdits(host, managed.file)) {
			return DEFERRED;
		}
		const patchResult: { outcome: VaultWriteOutcome } = {
			outcome: { status: 'written', appliedFields: [], conflictingFields: [] },
		};
		await host.fileManager.processFrontMatter(
			managed.file,
			(rawFrontMatter: Record<string, unknown>) => {
				patchResult.outcome = applyPatchInPlace(rawFrontMatter, patch, expected);
			},
		);
		return patchResult.outcome;
	});
}

async function replaceContent(
	dependencies: VaultAdapterDependencies,
	noteId: string,
	newBody: string,
	expectedBody: string,
): Promise<VaultWriteOutcome> {
	const { host, writeQueue } = dependencies;
	const managed = findManaged(host, noteId);
	if (managed === null) {
		return { status: 'not_found' };
	}
	return writeQueue.runExclusive(managed.file, async () => {
		if (await hasUnsavedEdits(host, managed.file)) {
			return DEFERRED;
		}
		const processResult: { bodyMatched: boolean } = { bodyMatched: false };
		await host.vault.process(managed.file, (noteText) => {
			const contentStart = getFrontMatterInfo(noteText).contentStart;
			processResult.bodyMatched = noteText.slice(contentStart) === expectedBody;
			return processResult.bodyMatched
				? `${noteText.slice(0, contentStart)}${newBody}`
				: noteText;
		});
		return processResult.bodyMatched
			? { status: 'written', appliedFields: ['body'], conflictingFields: [] }
			: { status: 'written', appliedFields: [], conflictingFields: ['body'] };
	});
}

async function createNote(
	host: VaultAdapterHost,
	request: { readonly title: string; readonly frontMatter: FrontMatter; readonly body: string },
): Promise<NoteSnapshot> {
	const noteId = request.frontMatter.id;
	if (typeof noteId !== 'string') {
		throw new Error('A new note needs a string id in its front matter.');
	}
	const parentFolder = host.fileManager.getNewFileParent('');
	const file = await host.vault.create(
		freeNotePath(host, parentFolder.path, request.title),
		request.body,
	);
	await host.fileManager.processFrontMatter(file, (rawFrontMatter: Record<string, unknown>) => {
		Object.assign(rawFrontMatter, request.frontMatter);
	});
	return { noteId, notePath: file.path, frontMatter: request.frontMatter };
}

function freeNotePath(host: VaultAdapterHost, folderPath: string, title: string): string {
	const cleanTitle =
		title.replace(FORBIDDEN_TITLE_CHARACTERS, ' ').replace(/\s+/g, ' ').trim() || 'Untitled';
	for (let suffix = 1; ; suffix += 1) {
		const candidateTitle = suffix === 1 ? cleanTitle : `${cleanTitle} ${String(suffix)}`;
		const candidatePath = normalizePath(`${folderPath}/${candidateTitle}.md`);
		if (host.vault.getFileByPath(candidatePath) === null) {
			return candidatePath;
		}
	}
}

function subscribeToChanges(
	dependencies: VaultAdapterDependencies,
	listener: (vaultChange: VaultChange) => void,
): () => void {
	const { host, registerEvent, getLogger } = dependencies;
	const notify = (vaultChange: VaultChange): void => {
		try {
			listener(vaultChange);
		} catch (thrown: unknown) {
			getLogger()?.error('plugin.vault.change_handler_failed', {
				changeKind: vaultChange.changeKind,
				thrownError: describeError(thrown),
			});
		}
	};
	const changedRef = host.metadataCache.on('changed', (file) => {
		notify({ changeKind: 'changed', notePath: file.path });
	});
	const renamedRef = host.vault.on('rename', (file, previousNotePath) => {
		if (file instanceof TFile) {
			notify({ changeKind: 'renamed', notePath: file.path, previousNotePath });
		}
	});
	const deletedRef = host.vault.on('delete', (file) => {
		if (file instanceof TFile) {
			notify({ changeKind: 'deleted', notePath: file.path });
		}
	});
	for (const eventRef of [changedRef, renamedRef, deletedRef]) {
		registerEvent(eventRef);
	}
	return () => {
		host.metadataCache.offref(changedRef);
		host.vault.offref(renamedRef);
		host.vault.offref(deletedRef);
	};
}
