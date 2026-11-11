import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT_PATH = path.resolve(import.meta.dirname, 'check-core-boundary.ts');
const CLEAN_TREE: Readonly<Record<string, string>> = {
	'src/index.ts': "export { settingsOperations } from './settings/index.ts';\n",
	'src/core/api.ts': "import { newId } from './ids.ts';\nexport const api = newId;\n",
	'src/core/ids.ts': 'export const newId = (): string => crypto.randomUUID();\n',
	'src/shared/dates.ts': "import { newId } from '../core/ids.ts';\nexport const id = newId;\n",
	'src/settings/index.ts':
		"import { api } from '../core/api.ts';\nexport const settingsOperations = [api];\n",
	'src/settings/rules.ts': "import { id } from '../shared/dates.ts';\nexport const rule = id;\n",
	'src/review/index.ts': 'export const review = 1;\n',
	'package.json': '{ "name": "fixture", "dependencies": { "zod": "^4.0.0" } }\n',
};

const createdFolders: string[] = [];

async function buildFixture(changes: Readonly<Record<string, string>> = {}): Promise<string> {
	const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'core-boundary-'));
	createdFolders.push(fixtureRoot);
	for (const [relativePath, contents] of Object.entries({ ...CLEAN_TREE, ...changes })) {
		const filePath = path.join(fixtureRoot, relativePath);
		await mkdir(path.dirname(filePath), { recursive: true });
		await writeFile(filePath, contents);
	}
	return fixtureRoot;
}

function runCheck(fixtureRoot: string): {
	readonly exitCode: number | null;
	readonly stderr: string;
} {
	const run = spawnSync(
		process.execPath,
		[
			SCRIPT_PATH,
			'--root',
			path.join(fixtureRoot, 'src'),
			'--package-json',
			path.join(fixtureRoot, 'package.json'),
		],
		{ encoding: 'utf8' },
	);
	return { exitCode: run.status, stderr: run.stderr };
}

afterEach(async () => {
	await Promise.all(createdFolders.splice(0).map((folder) => rm(folder, { recursive: true })));
});

describe('check-core-boundary', () => {
	it('passes a clean tree', async () => {
		expect(runCheck(await buildFixture()).exitCode).toBe(0);
	});

	it('fails a planted import of the host application', async () => {
		const run = runCheck(
			await buildFixture({ 'src/settings/host.ts': "import 'obsidian';\n" }),
		);
		expect(run.exitCode).toBe(1);
		expect(run.stderr).toContain('src/settings/host.ts');
	});

	it('fails a mention of the host application in a comment', async () => {
		const run = runCheck(
			await buildFixture({ 'src/core/note.ts': '// Works like OBSIDIAN does.\n' }),
		);
		expect(run.exitCode).toBe(1);
		expect(run.stderr).toContain("'line 1'");
	});

	it('fails a package.json dependency on the host application', async () => {
		const run = runCheck(
			await buildFixture({
				'package.json': '{ "devDependencies": { "obsidian": "1.0.0" } }\n',
			}),
		);
		expect(run.exitCode).toBe(1);
		expect(run.stderr).toContain('devDependencies');
	});

	it("fails an import of another slice's internal file", async () => {
		const run = runCheck(
			await buildFixture({
				'src/review/index.ts':
					"import { rule } from '../settings/rules.ts';\nexport const review = rule;\n",
			}),
		);
		expect(run.exitCode).toBe(1);
		expect(run.stderr).toContain('only through its index.ts');
	});

	it("passes an import of another slice's index.ts", async () => {
		const run = runCheck(
			await buildFixture({
				'src/review/index.ts':
					"import { settingsOperations } from '../settings/index.ts';\nexport const review = settingsOperations;\n",
			}),
		);
		expect(run.exitCode).toBe(0);
	});

	it('fails core/ importing shared/', async () => {
		const run = runCheck(
			await buildFixture({
				'src/core/api.ts':
					"import { id } from '../shared/dates.ts';\nexport const api = id;\n",
			}),
		);
		expect(run.exitCode).toBe(1);
		expect(run.stderr).toContain('core/ imports only from core/');
	});

	it('fails shared/ importing a slice', async () => {
		const run = runCheck(
			await buildFixture({
				'src/shared/dates.ts':
					"import { rule } from '../settings/index.ts';\nexport const id = rule;\n",
			}),
		);
		expect(run.exitCode).toBe(1);
		expect(run.stderr).toContain('shared/ never imports a slice');
	});
});
