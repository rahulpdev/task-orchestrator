/**
 * Copies the new version from `npm version` into every file that records it.
 *
 * Run by the root `version` script, which `npm version patch|minor|major` calls after it has
 * changed the root `package.json` and before it commits and tags. Reads the new version from
 * `npm_package_version` and, in the current folder:
 * - sets `version` in `manifest.json`;
 * - adds `versions.json[newVersion] = minAppVersion` when that entry is absent;
 * - sets `version` in every `packages/<name>/package.json`.
 * Every file is written tab-indented with a trailing newline.
 *
 * @packageDocumentation
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

type JsonObject = Record<string, unknown>;

async function readJsonObject(filePath: string): Promise<JsonObject> {
	const parsed: unknown = JSON.parse(await readFile(filePath, 'utf8'));
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new Error(`${filePath} does not hold a JSON object.`);
	}
	return { ...parsed };
}

async function writeJson(filePath: string, contents: JsonObject): Promise<void> {
	await writeFile(filePath, `${JSON.stringify(contents, null, '\t')}\n`, 'utf8');
}

async function listPackageManifests(rootPath: string): Promise<string[]> {
	const packagesFolder = path.join(rootPath, 'packages');
	const entries = await readdir(packagesFolder, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => path.join(packagesFolder, entry.name, 'package.json'));
}

/**
 * Writes the new version everywhere it is recorded.
 *
 * @param rootPath - The repository root.
 * @param newVersion - The version `npm version` chose.
 * @returns A promise that settles once every file is written.
 */
async function bumpVersion(rootPath: string, newVersion: string): Promise<void> {
	const manifestPath = path.join(rootPath, 'manifest.json');
	const manifest = await readJsonObject(manifestPath);
	const { minAppVersion } = manifest;
	if (typeof minAppVersion !== 'string') {
		throw new Error('manifest.json has no string minAppVersion.');
	}
	await writeJson(manifestPath, { ...manifest, version: newVersion });

	const versionsPath = path.join(rootPath, 'versions.json');
	const versions = await readJsonObject(versionsPath);
	if (!(newVersion in versions)) {
		await writeJson(versionsPath, { ...versions, [newVersion]: minAppVersion });
	}

	for (const packageManifestPath of await listPackageManifests(rootPath)) {
		const packageManifest = await readJsonObject(packageManifestPath);
		await writeJson(packageManifestPath, { ...packageManifest, version: newVersion });
	}
}

const newVersion = process.env.npm_package_version;
if (newVersion === undefined || newVersion === '') {
	console.error('version-bump: npm_package_version is not set; run this through `npm version`.');
	process.exitCode = 1;
} else {
	await bumpVersion(process.cwd(), newVersion);
}
