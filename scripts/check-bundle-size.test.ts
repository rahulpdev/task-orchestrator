import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
	createFixtureFolder,
	removeFixtureFolders,
	runScript,
} from './test-helpers/fixture-folder.ts';

const SCRIPT_PATH = path.resolve(import.meta.dirname, 'check-bundle-size.ts');

function metafileWithBundle(bundleBytes: number): string {
	return JSON.stringify({
		inputs: {
			'packages/plugin/src/main.ts': { bytes: 1_200 },
			'node_modules/zod/index.js': { bytes: 900_000 },
			'packages/core/src/index.ts': { bytes: 4_000 },
		},
		outputs: { 'main.js': { bytes: bundleBytes } },
	});
}

async function checkMetafile(metafileText: string) {
	const folderPath = await createFixtureFolder({ 'dist/esbuild-meta.json': metafileText });
	return runScript(SCRIPT_PATH, [], { cwd: folderPath });
}

afterEach(removeFixtureFolders);

describe('check-bundle-size', () => {
	it('passes a bundle within the budget', async () => {
		expect((await checkMetafile(metafileWithBundle(110_000))).exitCode).toBe(0);
	});

	it('fails an oversized bundle and names its size and the largest inputs, largest first', async () => {
		const run = await checkMetafile(metafileWithBundle(2_000_000));
		expect(run.exitCode).toBe(1);
		expect(run.stderr).toContain('2000000 bytes');
		expect(run.stderr.indexOf('node_modules/zod/index.js')).toBeLessThan(
			run.stderr.indexOf('packages/core/src/index.ts'),
		);
	});

	it('fails when the metafile is missing or lists no main.js', async () => {
		const folderPath = await createFixtureFolder({});
		expect(runScript(SCRIPT_PATH, [], { cwd: folderPath }).exitCode).toBe(1);
		expect((await checkMetafile('{"outputs":{}}')).exitCode).toBe(1);
	});
});
