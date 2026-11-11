/**
 * Copies the built plugin files into the development vault, so Obsidian can load each rebuild.
 * Used by `pnpm dev`; copying avoids a symlink from
 * `test-vault/` back into the repository, which would make linters and test globs recurse.
 *
 * @packageDocumentation
 */
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

/** The files Obsidian loads for a plugin, all at the repository root after a build. */
export const PLUGIN_FILES = ['main.js', 'manifest.json', 'styles.css'] as const;

/**
 * Copies `main.js`, `manifest.json` and `styles.css` into the development vault's plugin folder.
 *
 * @param repositoryRoot - The repository's root folder.
 * @returns A promise that settles once every file is copied.
 */
export async function copyToDevVault(repositoryRoot: string): Promise<void> {
	const pluginFolder = path.join(
		repositoryRoot,
		'test-vault',
		'.obsidian',
		'plugins',
		'task-orchestrator',
	);
	await mkdir(pluginFolder, { recursive: true });
	for (const fileName of PLUGIN_FILES) {
		await copyFile(path.join(repositoryRoot, fileName), path.join(pluginFolder, fileName));
	}
}
