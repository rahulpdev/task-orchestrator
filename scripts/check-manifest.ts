/**
 * Checks `manifest.json` and the files around it against the community directory's
 * submission rules, plus this repository's own: the plugin is desktop-only (decision D1) and
 * every package version equals the manifest version.
 *
 * Usage: `node scripts/check-manifest.ts [--tag <tag>]`, run from the repository root. With
 * `--tag`, the tag must equal the manifest version. Exits 0 when every rule holds, 1 with one
 * line per problem otherwise. Uses no dependencies.
 *
 * @packageDocumentation
 */
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

type JsonObject = Readonly<Record<string, unknown>>;

const REQUIRED_STRING_KEYS = ['id', 'name', 'version', 'minAppVersion', 'description', 'author'];
const ALLOWED_KEYS = new Set([...REQUIRED_STRING_KEYS, 'isDesktopOnly', 'authorUrl', 'fundingUrl']);
const SEMANTIC_VERSION = /^\d+\.\d+\.\d+$/;
const NAME_CHARACTERS = /^[A-Za-z0-9 \-+()]+$/;
const BANNED_NAME_PARTS = /obsidian|obsi|sidian|plugin/i;
const EMOJI = /\p{Extended_Pictographic}/u;

function textOf(manifest: JsonObject, key: string): string {
	const value = manifest[key];
	return typeof value === 'string' ? value : '';
}

function checkKeys(manifest: JsonObject): string[] {
	const problems = REQUIRED_STRING_KEYS.filter((key) => typeof manifest[key] !== 'string').map(
		(key) => `manifest.json: "${key}" must be a string`,
	);
	if (manifest.isDesktopOnly !== true) {
		problems.push('manifest.json: "isDesktopOnly" must be true (the plugin is desktop-only)');
	}
	for (const key of Object.keys(manifest).filter((candidate) => !ALLOWED_KEYS.has(candidate))) {
		problems.push(`manifest.json: unexpected key "${key}"`);
	}
	for (const key of ['version', 'minAppVersion']) {
		if (!SEMANTIC_VERSION.test(textOf(manifest, key))) {
			problems.push(`manifest.json: "${key}" must look like 1.2.3`);
		}
	}
	return problems;
}

function checkIdAndName(manifest: JsonObject): string[] {
	const problems: string[] = [];
	const pluginId = textOf(manifest, 'id');
	if (
		!/^[a-z-]+$/.test(pluginId) ||
		pluginId.includes('obsidian') ||
		pluginId.endsWith('plugin')
	) {
		problems.push(
			'manifest.json: "id" must use lowercase letters and hyphens, not contain "obsidian" and not end with "plugin"',
		);
	}
	const pluginName = textOf(manifest, 'name');
	if (!NAME_CHARACTERS.test(pluginName) || BANNED_NAME_PARTS.test(pluginName)) {
		problems.push(
			'manifest.json: "name" may use only Basic Latin letters, digits, spaces and -+(), and may not contain "Obsidian" or "Plugin"',
		);
	}
	return problems;
}

function checkDescription(manifest: JsonObject): string[] {
	const description = textOf(manifest, 'description');
	const problems: string[] = [];
	if (description.length < 10 || description.length > 250) {
		problems.push(
			`manifest.json: "description" must be 10 to 250 characters (it is ${String(description.length)})`,
		);
	}
	if (!/^[A-Z]/.test(description)) {
		problems.push('manifest.json: "description" must start with a capital letter');
	}
	if (!description.endsWith('.')) {
		problems.push('manifest.json: "description" must end with a period');
	}
	if (EMOJI.test(description)) {
		problems.push('manifest.json: "description" may not contain emoji');
	}
	if (/^this is a plugin/i.test(description)) {
		problems.push('manifest.json: "description" may not start with "This is a plugin"');
	}
	return problems;
}

function checkUrls(manifest: JsonObject): string[] {
	const problems: string[] = [];
	const { authorUrl, fundingUrl } = manifest;
	if (
		authorUrl !== undefined &&
		(typeof authorUrl !== 'string' || authorUrl === 'https://obsidian.md')
	) {
		problems.push('manifest.json: "authorUrl" must be your own URL, not https://obsidian.md');
	}
	if (fundingUrl !== undefined) {
		const fundingLinks =
			typeof fundingUrl === 'object' && fundingUrl !== null
				? Object.values(fundingUrl)
				: [fundingUrl];
		const badLink = fundingLinks.some(
			(link) =>
				typeof link !== 'string' ||
				!/^https?:\/\/\S+$/.test(link) ||
				link === 'https://obsidian.md/pricing',
		);
		if (badLink) {
			problems.push(
				'manifest.json: "fundingUrl" must be a URL of your own, not https://obsidian.md/pricing',
			);
		}
	}
	return problems;
}

async function readJsonObject(filePath: string): Promise<JsonObject | null> {
	try {
		const parsed: unknown = JSON.parse(await readFile(filePath, 'utf8'));
		return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
			? { ...parsed }
			: null;
	} catch {
		return null;
	}
}

async function checkVersionFiles(rootPath: string, manifestVersion: string): Promise<string[]> {
	const problems: string[] = [];
	const versions = await readJsonObject(path.join(rootPath, 'versions.json'));
	if (versions === null) {
		return ['versions.json: missing or not a JSON object'];
	}
	if (!(manifestVersion in versions)) {
		problems.push(`versions.json: no entry for the manifest version ${manifestVersion}`);
	}
	for (const [pluginVersion, appVersion] of Object.entries(versions)) {
		if (typeof appVersion !== 'string' || !SEMANTIC_VERSION.test(appVersion)) {
			problems.push(`versions.json: the value for ${pluginVersion} must look like 1.2.3`);
		}
	}
	const packagesFolder = path.join(rootPath, 'packages');
	const packageFolders = (await readdir(packagesFolder, { withFileTypes: true })).filter(
		(entry) => entry.isDirectory(),
	);
	const manifestPaths = [
		'package.json',
		...packageFolders.map((entry) => path.join('packages', entry.name, 'package.json')),
	];
	for (const manifestPath of manifestPaths) {
		const packageManifest = await readJsonObject(path.join(rootPath, manifestPath));
		if (packageManifest?.version !== manifestVersion) {
			problems.push(
				`${manifestPath}: "version" must equal the manifest version ${manifestVersion}`,
			);
		}
	}
	return problems;
}

async function checkRequiredFiles(rootPath: string): Promise<string[]> {
	const problems: string[] = [];
	for (const fileName of ['README.md', 'LICENSE', 'manifest.json']) {
		try {
			await access(path.join(rootPath, fileName));
		} catch {
			problems.push(`${fileName}: missing`);
		}
	}
	try {
		if ((await readFile(path.join(rootPath, 'LICENSE'), 'utf8')).includes('Dynalist')) {
			problems.push('LICENSE: still names Dynalist, the sample plugin licensor');
		}
	} catch {
		// Already reported as missing above.
	}
	return problems;
}

/**
 * Runs every check from the command line and sets the exit code.
 *
 * @param argumentList - The arguments after the script name.
 * @returns A promise that settles once the result has been printed.
 */
async function main(argumentList: readonly string[]): Promise<void> {
	const rootPath = process.cwd();
	const manifest = await readJsonObject(path.join(rootPath, 'manifest.json'));
	const problems =
		manifest === null
			? ['manifest.json: missing or not a JSON object']
			: [
					...checkKeys(manifest),
					...checkIdAndName(manifest),
					...checkDescription(manifest),
					...checkUrls(manifest),
					...(await checkVersionFiles(rootPath, textOf(manifest, 'version'))),
				];
	problems.push(...(await checkRequiredFiles(rootPath)));
	const tagIndex = argumentList.indexOf('--tag');
	const releaseTag = tagIndex === -1 ? undefined : argumentList[tagIndex + 1];
	if (
		manifest !== null &&
		releaseTag !== undefined &&
		releaseTag !== textOf(manifest, 'version')
	) {
		problems.push(
			`--tag: the tag ${releaseTag} must equal the manifest version ${textOf(manifest, 'version')}`,
		);
	}
	for (const problem of problems) {
		console.error(problem);
	}
	if (problems.length > 0) {
		process.exitCode = 1;
		return;
	}
	console.debug('check-manifest: every manifest rule passes');
}

await main(process.argv.slice(2));
