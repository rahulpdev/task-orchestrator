import { describe, expect, it } from 'vitest';
import { createObsidianStoreAdapter } from './store-adapter.ts';
import type { StoreFileApi } from './store-adapter.ts';

function createFakeFileApi(renameRefusesExistingTarget = false): {
	readonly fileApi: StoreFileApi;
	readonly files: Map<string, string>;
	readonly folders: Set<string>;
} {
	const files = new Map<string, string>();
	const folders = new Set<string>();
	const fileApi: StoreFileApi = {
		exists: (filePath) => Promise.resolve(files.has(filePath) || folders.has(filePath)),
		read: (filePath) => Promise.resolve(files.get(filePath) ?? ''),
		write: (filePath, data) => {
			files.set(filePath, data);
			return Promise.resolve();
		},
		append: (filePath, data) => {
			files.set(filePath, `${files.get(filePath) ?? ''}${data}`);
			return Promise.resolve();
		},
		list: (folderPath) =>
			Promise.resolve({
				files: [...files.keys()].filter((filePath) =>
					filePath.startsWith(`${folderPath}/`),
				),
				folders: [],
			}),
		mkdir: (folderPath) => {
			folders.add(folderPath);
			return Promise.resolve();
		},
		remove: (filePath) => {
			files.delete(filePath);
			return Promise.resolve();
		},
		rename: (fromPath, toPath) => {
			if (renameRefusesExistingTarget && files.has(toPath)) {
				return Promise.reject(new Error('Destination file already exists!'));
			}
			files.set(toPath, files.get(fromPath) ?? '');
			files.delete(fromPath);
			return Promise.resolve();
		},
	};
	return { fileApi, files, folders };
}

describe('createObsidianStoreAdapter', () => {
	it('writes through a temporary file into the store folder and reads it back', async () => {
		const { fileApi, files, folders } = createFakeFileApi();
		const store = createObsidianStoreAdapter(fileApi);
		await store.writeFileAtomic('settings.json', '{}\n');
		expect([...files.keys()]).toEqual(['.task-orchestrator/settings.json']);
		expect(folders.has('.task-orchestrator')).toBe(true);
		expect(await store.readFile('settings.json')).toEqual({
			status: 'found',
			contents: '{}\n',
		});
		expect(await store.readFile('missing.json')).toEqual({ status: 'missing' });
	});

	it('replaces an existing file when rename refuses to overwrite it', async () => {
		const { fileApi, files } = createFakeFileApi(true);
		const store = createObsidianStoreAdapter(fileApi);
		await store.writeFileAtomic('settings.json', 'old');
		await store.writeFileAtomic('settings.json', 'new');
		expect(Object.fromEntries(files)).toEqual({ '.task-orchestrator/settings.json': 'new' });
	});

	it('appends lines into nested folders, lists and deletes', async () => {
		const { fileApi, folders } = createFakeFileApi();
		const store = createObsidianStoreAdapter(fileApi);
		await store.appendLine('logs/application-2026-11.jsonl', '{"a":1}');
		await store.appendLine('logs/application-2026-11.jsonl', '{"a":2}');
		expect(folders.has('.task-orchestrator/logs')).toBe(true);
		expect(await store.readFile('logs/application-2026-11.jsonl')).toEqual({
			status: 'found',
			contents: '{"a":1}\n{"a":2}\n',
		});
		expect(await store.listFolder('logs')).toEqual(['application-2026-11.jsonl']);
		expect(await store.listFolder('nowhere')).toEqual([]);
		await store.deleteFile('logs/application-2026-11.jsonl');
		await store.deleteFile('logs/application-2026-11.jsonl');
		expect(await store.readFile('logs/application-2026-11.jsonl')).toEqual({
			status: 'missing',
		});
	});

	it('refuses a path that leaves the store folder', async () => {
		const store = createObsidianStoreAdapter(createFakeFileApi().fileApi);
		await expect(store.readFile('../secrets.md')).rejects.toThrow(/leaves the store folder/);
	});
});
