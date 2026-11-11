/**
 * Temporary fixture folders for the script tests, deleted after each test.
 *
 * @packageDocumentation
 */
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const createdFolders: string[] = [];

/**
 * Creates a temporary folder holding the given files.
 *
 * @param files - File contents keyed by path relative to the folder.
 * @returns The folder's path.
 */
export async function createFixtureFolder(
	files: Readonly<Record<string, string>>,
): Promise<string> {
	const folderPath = await mkdtemp(path.join(tmpdir(), 'script-fixture-'));
	createdFolders.push(folderPath);
	for (const [relativePath, contents] of Object.entries(files)) {
		const filePath = path.join(folderPath, relativePath);
		await mkdir(path.dirname(filePath), { recursive: true });
		await writeFile(filePath, contents);
	}
	return folderPath;
}

/**
 * Deletes every folder {@link createFixtureFolder} created.
 *
 * @returns A promise that settles once the folders are gone.
 */
export async function removeFixtureFolders(): Promise<void> {
	await Promise.all(
		createdFolders.splice(0).map((folderPath) => rm(folderPath, { recursive: true })),
	);
}

/**
 * Runs a script with Node in the given folder.
 *
 * @param scriptPath - Absolute path of the script.
 * @param scriptArguments - Arguments after the script path.
 * @param runOptions - Working folder and extra environment variables.
 * @returns The exit code and both output streams.
 */
export function runScript(
	scriptPath: string,
	scriptArguments: readonly string[],
	runOptions: { readonly cwd: string; readonly env?: Readonly<Record<string, string>> },
): { readonly exitCode: number | null; readonly stdout: string; readonly stderr: string } {
	const run = spawnSync(process.execPath, [scriptPath, ...scriptArguments], {
		cwd: runOptions.cwd,
		env: { ...process.env, ...runOptions.env },
		encoding: 'utf8',
	});
	return { exitCode: run.status, stdout: run.stdout, stderr: run.stderr };
}
