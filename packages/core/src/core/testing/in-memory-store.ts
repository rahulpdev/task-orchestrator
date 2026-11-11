/**
 * A local store held in memory, for core tests.
 *
 * @packageDocumentation
 */
import type { StorePort } from '../ports.ts';

/** The in-memory store plus direct access to its files, for assertions. */
export interface InMemoryStore extends StorePort {
	/** Every file, keyed by its path relative to the store folder. */
	readonly files: Map<string, string>;
}

/**
 * Creates a local store held in memory.
 *
 * @param seedFiles - Files the store starts with, keyed by path.
 * @returns A store adapter whose writes change only the in-memory files.
 */
export function createInMemoryStore(
	seedFiles: Readonly<Record<string, string>> = {},
): InMemoryStore {
	const files = new Map(Object.entries(seedFiles));
	return {
		files,
		readFile: (storePath) => {
			const contents = files.get(storePath);
			return Promise.resolve(
				contents === undefined ? { status: 'missing' } : { status: 'found', contents },
			);
		},
		writeFileAtomic: (storePath, contents) => {
			files.set(storePath, contents);
			return Promise.resolve();
		},
		appendLine: (storePath, line) => {
			files.set(storePath, `${files.get(storePath) ?? ''}${line}\n`);
			return Promise.resolve();
		},
		listFolder: (storePath) => {
			const prefix = storePath === '' ? '' : `${storePath.replace(/\/+$/, '')}/`;
			const names = new Set<string>();
			for (const filePath of files.keys()) {
				if (filePath.startsWith(prefix)) {
					names.add(filePath.slice(prefix.length).split('/')[0] ?? '');
				}
			}
			return Promise.resolve([...names].sort());
		},
		deleteFile: (storePath) => {
			files.delete(storePath);
			return Promise.resolve();
		},
	};
}
