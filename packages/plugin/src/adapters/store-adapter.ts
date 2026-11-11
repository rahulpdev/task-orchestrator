/**
 * The local store: plain files in the hidden folder `.task-orchestrator/` at the vault root.
 *
 * Obsidian's vault index does not list hidden folders, so this adapter uses the low-level
 * `app.vault.adapter` file API, which is the right tool for them.
 *
 * @packageDocumentation
 */
import { normalizePath } from 'obsidian';
import type { DataAdapter } from 'obsidian';
import type { StorePort } from '@task-orchestrator/core';

/** The parts of the vault's low-level file API the store uses. */
export type StoreFileApi = Pick<
	DataAdapter,
	'exists' | 'read' | 'write' | 'append' | 'list' | 'mkdir' | 'remove' | 'rename'
>;

/** The store folder at the top of the vault. */
export const STORE_FOLDER = '.task-orchestrator';

/**
 * Creates the store adapter.
 *
 * `writeFileAtomic` writes `<path>.tmp` and renames it over the target. If the rename is refused
 * because the target exists, the target is removed and the rename tried again; a reader can
 * then briefly see the file missing, but never half-written.
 *
 * @param dataAdapter - The vault's low-level file API, `app.vault.adapter`.
 * @returns The store adapter. Every path is relative to the store folder and may not leave it.
 */
export function createObsidianStoreAdapter(dataAdapter: StoreFileApi): StorePort {
	return {
		readFile: async (storePath) => {
			const filePath = toVaultPath(storePath);
			return (await dataAdapter.exists(filePath))
				? { status: 'found', contents: await dataAdapter.read(filePath) }
				: { status: 'missing' };
		},
		writeFileAtomic: async (storePath, contents) => {
			const filePath = toVaultPath(storePath);
			await ensureParentFolder(dataAdapter, filePath);
			const temporaryPath = `${filePath}.tmp`;
			await dataAdapter.write(temporaryPath, contents);
			try {
				await dataAdapter.rename(temporaryPath, filePath);
			} catch (thrown: unknown) {
				if (!(await dataAdapter.exists(filePath))) {
					throw thrown;
				}
				await dataAdapter.remove(filePath);
				await dataAdapter.rename(temporaryPath, filePath);
			}
		},
		appendLine: async (storePath, line) => {
			const filePath = toVaultPath(storePath);
			await ensureParentFolder(dataAdapter, filePath);
			await dataAdapter.append(filePath, `${line}\n`);
		},
		listFolder: async (storePath) => {
			const folderPath = toVaultPath(storePath);
			if (!(await dataAdapter.exists(folderPath))) {
				return [];
			}
			const listed = await dataAdapter.list(folderPath);
			return [...listed.files, ...listed.folders]
				.map((listedPath) => listedPath.slice(listedPath.lastIndexOf('/') + 1))
				.sort();
		},
		deleteFile: async (storePath) => {
			const filePath = toVaultPath(storePath);
			if (await dataAdapter.exists(filePath)) {
				await dataAdapter.remove(filePath);
			}
		},
	};
}

function toVaultPath(storePath: string): string {
	const segments = normalizePath(storePath).split('/');
	if (segments.includes('..')) {
		throw new Error(`Store path leaves the store folder: ${storePath}`);
	}
	return normalizePath(`${STORE_FOLDER}/${segments.join('/')}`);
}

async function ensureParentFolder(dataAdapter: StoreFileApi, filePath: string): Promise<void> {
	const segments = filePath.split('/').slice(0, -1);
	for (let depth = 1; depth <= segments.length; depth += 1) {
		const folderPath = segments.slice(0, depth).join('/');
		if (!(await dataAdapter.exists(folderPath))) {
			await dataAdapter.mkdir(folderPath);
		}
	}
}
