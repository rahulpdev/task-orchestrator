/**
 * Checks the import boundaries inside the application core that ESLint cannot check reliably.
 *
 * Rules, applied to every TypeScript file under the core's `src/` folder:
 * 1. A file under `core/` never imports anything under `src/` outside `core/`.
 * 2. A file under a slice folder imports another slice only through that slice's `index.ts`.
 * 3. A file under `shared/` never imports a slice.
 *
 * It also bans the host application from the core (TAD 2.1): no file under `src/` may contain
 * the word "obsidian" in any letter case, in code or comments, and the core's `package.json`
 * may not list `obsidian` in any dependency field.
 *
 * Usage: `node scripts/check-core-boundary.ts [--root <dir>] [--package-json <path>]`
 * (defaults `packages/core/src` and `packages/core/package.json`).
 * Exits 0 when every rule holds, 1 with one line per violation otherwise.
 *
 * @packageDocumentation
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

/** One broken rule: the file, the text that breaks it (a specifier, line or field) and the rule. */
interface BoundaryViolation {
	readonly filePath: string;
	readonly offendingText: string;
	readonly ruleText: string;
}

const CORE_FOLDER = 'core';
const SHARED_FOLDER = 'shared';
const BANNED_WORD_PATTERN = /obsidian/i;
const DEPENDENCY_FIELDS = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
] as const;
const SPECIFIER_PATTERNS: readonly RegExp[] = [
	/\bfrom\s+['"]([^'"]+)['"]/g,
	/\bimport\s+['"]([^'"]+)['"]/g,
	/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

/**
 * Reads the value that follows a command-line flag.
 *
 * @param argumentList - The arguments after the script name.
 * @param flagName - The flag to look for, such as `--root`.
 * @returns The value after the flag, or `undefined` when the flag is absent.
 */
function readFlag(argumentList: readonly string[], flagName: string): string | undefined {
	const flagIndex = argumentList.indexOf(flagName);
	return flagIndex === -1 ? undefined : argumentList[flagIndex + 1];
}

/**
 * Lists every TypeScript file below a folder.
 *
 * @param folderPath - The folder to walk.
 * @returns Absolute paths of every `.ts` file found, in no particular order.
 */
async function listTypeScriptFiles(folderPath: string): Promise<string[]> {
	const entries = await readdir(folderPath, { withFileTypes: true, recursive: true });
	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
		.map((entry) => path.join(entry.parentPath, entry.name));
}

/**
 * Finds every module specifier in a file's text: static imports, re-exports and dynamic imports.
 *
 * @param sourceText - The file's contents.
 * @returns The specifiers in the order found.
 */
function findSpecifiers(sourceText: string): string[] {
	const specifiers: string[] = [];
	for (const pattern of SPECIFIER_PATTERNS) {
		for (const match of sourceText.matchAll(pattern)) {
			const specifier = match[1];
			if (specifier !== undefined) {
				specifiers.push(specifier);
			}
		}
	}
	return specifiers;
}

/**
 * Names the top-level folder of `src/` that a path sits in.
 *
 * @param rootPath - The core's `src/` folder.
 * @param targetPath - An absolute path.
 * @returns The folder name, `null` for a file directly in `src/`, or `undefined` outside `src/`.
 */
function topFolderOf(rootPath: string, targetPath: string): string | null | undefined {
	const relativePath = path.relative(rootPath, targetPath);
	if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
		return undefined;
	}
	const segments = relativePath.split(path.sep);
	return segments.length > 1 ? (segments[0] ?? null) : null;
}

/**
 * Decides which rule, if any, one resolved import breaks.
 *
 * @param rootPath - The core's `src/` folder.
 * @param importingFile - Absolute path of the file that holds the import.
 * @param targetPath - Absolute path the specifier resolves to.
 * @returns The broken rule's text, or `null` when the import is allowed.
 */
function brokenRule(rootPath: string, importingFile: string, targetPath: string): string | null {
	const sourceFolder = topFolderOf(rootPath, importingFile);
	const targetFolder = topFolderOf(rootPath, targetPath);
	if (targetFolder === undefined || sourceFolder === undefined || sourceFolder === null) {
		return null;
	}
	if (sourceFolder === CORE_FOLDER) {
		return targetFolder === CORE_FOLDER ? null : 'core/ imports only from core/';
	}
	if (sourceFolder === SHARED_FOLDER) {
		const importsSlice =
			targetFolder !== null && targetFolder !== CORE_FOLDER && targetFolder !== SHARED_FOLDER;
		return importsSlice ? 'shared/ never imports a slice' : null;
	}
	const allowedTarget =
		targetFolder === null ||
		targetFolder === CORE_FOLDER ||
		targetFolder === SHARED_FOLDER ||
		targetFolder === sourceFolder ||
		targetPath === path.join(rootPath, targetFolder, 'index.ts');
	return allowedTarget ? null : 'a slice imports another slice only through its index.ts';
}

/**
 * Checks every import in every TypeScript file under the root folder.
 *
 * @param rootPath - The core's `src/` folder.
 * @returns Every violation found; empty when the boundaries hold.
 */
async function checkImports(rootPath: string): Promise<BoundaryViolation[]> {
	const violations: BoundaryViolation[] = [];
	for (const filePath of await listTypeScriptFiles(rootPath)) {
		const sourceText = await readFile(filePath, 'utf8');
		for (const specifier of findSpecifiers(sourceText)) {
			if (!specifier.startsWith('.')) {
				continue;
			}
			const targetPath = path.resolve(path.dirname(filePath), specifier);
			const ruleText = brokenRule(rootPath, filePath, targetPath);
			if (ruleText !== null) {
				violations.push({ filePath, offendingText: specifier, ruleText });
			}
		}
	}
	return violations;
}

/**
 * Finds every line of every file under the root that names the host application.
 *
 * @param rootPath - The core's `src/` folder.
 * @returns One violation per offending line.
 */
async function checkBannedWord(rootPath: string): Promise<BoundaryViolation[]> {
	const entries = await readdir(rootPath, { withFileTypes: true, recursive: true });
	const violations: BoundaryViolation[] = [];
	for (const entry of entries.filter((candidate) => candidate.isFile())) {
		const filePath = path.join(entry.parentPath, entry.name);
		const lines = (await readFile(filePath, 'utf8')).split('\n');
		lines.forEach((lineText, lineIndex) => {
			if (BANNED_WORD_PATTERN.test(lineText)) {
				const offendingText = `line ${String(lineIndex + 1)}`;
				violations.push({
					filePath,
					offendingText,
					ruleText: 'the core never names the host application',
				});
			}
		});
	}
	return violations;
}

/**
 * Checks that the core's package manifest does not depend on the host application's API.
 *
 * @param packageJsonPath - Path of the core's `package.json`.
 * @returns One violation per dependency field that lists `obsidian`.
 */
async function checkPackageJson(packageJsonPath: string): Promise<BoundaryViolation[]> {
	const manifest: unknown = JSON.parse(await readFile(packageJsonPath, 'utf8'));
	if (typeof manifest !== 'object' || manifest === null) {
		return [];
	}
	const violations: BoundaryViolation[] = [];
	for (const fieldName of DEPENDENCY_FIELDS) {
		const dependencies: unknown = Reflect.get(manifest, fieldName);
		if (
			typeof dependencies === 'object' &&
			dependencies !== null &&
			'obsidian' in dependencies
		) {
			violations.push({
				filePath: packageJsonPath,
				offendingText: `${fieldName}.obsidian`,
				ruleText: 'the core never depends on the host application',
			});
		}
	}
	return violations;
}

/**
 * Runs every check from the command line and sets the exit code.
 *
 * @param argumentList - The arguments after the script name.
 * @returns A promise that settles once the result has been printed.
 */
async function main(argumentList: readonly string[]): Promise<void> {
	const rootPath = path.resolve(readFlag(argumentList, '--root') ?? 'packages/core/src');
	const packageJsonPath = path.resolve(
		readFlag(argumentList, '--package-json') ?? 'packages/core/package.json',
	);
	const violations = [
		...(await checkImports(rootPath)),
		...(await checkBannedWord(rootPath)),
		...(await checkPackageJson(packageJsonPath)),
	];
	for (const violation of violations) {
		const shownPath = path.relative(process.cwd(), violation.filePath);
		console.error(
			`${shownPath}: '${violation.offendingText}' breaks rule: ${violation.ruleText}`,
		);
	}
	if (violations.length > 0) {
		process.exitCode = 1;
		return;
	}
	console.debug(
		`check-core-boundary: no violations in ${path.relative(process.cwd(), rootPath)}`,
	);
}

await main(process.argv.slice(2));
