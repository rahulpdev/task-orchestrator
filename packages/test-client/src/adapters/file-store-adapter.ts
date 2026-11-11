/**
 * The local store over plain files in `<vault>/.task-orchestrator/`, for the test client.
 *
 * @packageDocumentation
 */
import { appendFile, mkdir, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import type { StorePort } from '@task-orchestrator/core';
import { writeFileAtomically } from './note-file.ts';

/** The store folder's name at the top of the vault. */
export const STORE_FOLDER_NAME = '.task-orchestrator';

/**
 * Creates a store adapter over the vault's store folder.
 *
 * @param vaultPath - The vault's root folder.
 * @returns The store adapter. Every path is relative to the store folder and may not leave it.
 */
export function createFileStoreAdapter(vaultPath: string): StorePort {
	const storeRoot = path.resolve(vaultPath, STORE_FOLDER_NAME);
	const resolve = (storePath: string): string => resolveInside(storeRoot, storePath);
	return {
		readFile: async (storePath) => {
			try {
				return { status: 'found', contents: await readFile(resolve(storePath), 'utf8') };
			} catch (thrown: unknown) {
				if (isMissingFileError(thrown)) {
					return { status: 'missing' };
				}
				throw thrown;
			}
		},
		writeFileAtomic: (storePath, contents) => writeFileAtomically(resolve(storePath), contents),
		appendLine: async (storePath, line) => {
			const filePath = resolve(storePath);
			await mkdir(path.dirname(filePath), { recursive: true });
			await appendFile(filePath, `${line}\n`, 'utf8');
		},
		listFolder: async (storePath) => {
			try {
				return (await readdir(resolve(storePath))).sort();
			} catch (thrown: unknown) {
				if (isMissingFileError(thrown)) {
					return [];
				}
				throw thrown;
			}
		},
		deleteFile: (storePath) => rm(resolve(storePath), { force: true }),
	};
}

function resolveInside(storeRoot: string, storePath: string): string {
	const resolvedPath = path.resolve(storeRoot, storePath);
	const relativePath = path.relative(storeRoot, resolvedPath);
	if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
		throw new Error(`Store path leaves the store folder: ${storePath}`);
	}
	return resolvedPath;
}

function isMissingFileError(thrown: unknown): boolean {
	return thrown instanceof Error && 'code' in thrown && thrown.code === 'ENOENT';
}
