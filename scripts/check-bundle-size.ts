/**
 * Fails when the built `main.js` is larger than the size budget, and then lists the largest
 * inputs so the cause is easy to find.
 *
 * Usage: `node scripts/check-bundle-size.ts [--metafile <path>]` (default
 * `dist/esbuild-meta.json`, written by `pnpm build`). Exits 0 within budget, 1 over it or when
 * the metafile is missing.
 *
 * @packageDocumentation
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

/** The largest `main.js` allowed: 1 MB. */
export const BUNDLE_SIZE_BUDGET_BYTES = 1_048_576;

const LARGEST_INPUTS_SHOWN = 10;

interface SizedEntry {
	readonly entryPath: string;
	readonly bytes: number;
}

function sizedEntries(section: unknown): SizedEntry[] {
	if (typeof section !== 'object' || section === null) {
		return [];
	}
	return Object.entries(section).flatMap(([entryPath, entry]: [string, unknown]) => {
		const bytes: unknown =
			typeof entry === 'object' && entry !== null ? Reflect.get(entry, 'bytes') : undefined;
		return typeof bytes === 'number' ? [{ entryPath, bytes }] : [];
	});
}

/**
 * Checks the bundle size from the command line and sets the exit code.
 *
 * @param argumentList - The arguments after the script name.
 * @returns A promise that settles once the result has been printed.
 */
async function main(argumentList: readonly string[]): Promise<void> {
	const flagIndex = argumentList.indexOf('--metafile');
	const metafilePath = path.resolve(
		(flagIndex === -1 ? undefined : argumentList[flagIndex + 1]) ?? 'dist/esbuild-meta.json',
	);
	let metafile: unknown;
	try {
		metafile = JSON.parse(await readFile(metafilePath, 'utf8'));
	} catch {
		console.error(`check-bundle-size: cannot read ${metafilePath}; run \`pnpm build\` first.`);
		process.exitCode = 1;
		return;
	}
	const section = (name: string): unknown =>
		typeof metafile === 'object' && metafile !== null ? Reflect.get(metafile, name) : undefined;
	const bundle = sizedEntries(section('outputs')).find((output) =>
		output.entryPath.endsWith('main.js'),
	);
	if (bundle === undefined) {
		console.error('check-bundle-size: the metafile lists no main.js output.');
		process.exitCode = 1;
		return;
	}
	if (bundle.bytes <= BUNDLE_SIZE_BUDGET_BYTES) {
		console.debug(
			`check-bundle-size: main.js is ${String(bundle.bytes)} bytes, within the ${String(BUNDLE_SIZE_BUDGET_BYTES)}-byte budget`,
		);
		return;
	}
	console.error(
		`check-bundle-size: main.js is ${String(bundle.bytes)} bytes, over the ${String(BUNDLE_SIZE_BUDGET_BYTES)}-byte budget. Largest inputs:`,
	);
	const largestInputs = sizedEntries(section('inputs'))
		.sort((first, second) => second.bytes - first.bytes)
		.slice(0, LARGEST_INPUTS_SHOWN);
	for (const input of largestInputs) {
		console.error(`  ${String(input.bytes).padStart(10)}  ${input.entryPath}`);
	}
	process.exitCode = 1;
}

await main(process.argv.slice(2));
