import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
	createFixtureFolder,
	removeFixtureFolders,
	runScript,
} from './test-helpers/fixture-folder.ts';

const SCRIPT_PATH = path.resolve(import.meta.dirname, 'version-bump.ts');

const FIXTURE: Readonly<Record<string, string>> = {
	'manifest.json': '{"id":"task-orchestrator","version":"0.1.0","minAppVersion":"1.15.0"}',
	'versions.json': '{"0.1.0":"1.15.0"}',
	'packages/core/package.json': '{"name":"@task-orchestrator/core","version":"0.1.0"}',
	'packages/plugin/package.json': '{"name":"@task-orchestrator/plugin","version":"0.1.0"}',
};

afterEach(removeFixtureFolders);

describe('version-bump', () => {
	it('writes the new version into manifest.json and every package.json', async () => {
		const folderPath = await createFixtureFolder(FIXTURE);
		const run = runScript(SCRIPT_PATH, [], {
			cwd: folderPath,
			env: { npm_package_version: '0.2.0' },
		});
		expect(run.exitCode).toBe(0);
		for (const filePath of [
			'manifest.json',
			'packages/core/package.json',
			'packages/plugin/package.json',
		]) {
			const parsed: unknown = JSON.parse(
				await readFile(path.join(folderPath, filePath), 'utf8'),
			);
			expect(parsed).toMatchObject({ version: '0.2.0' });
		}
	});

	it('adds a versions.json entry only when it is absent', async () => {
		const folderPath = await createFixtureFolder({
			...FIXTURE,
			'versions.json': '{"0.2.0":"1.0.0"}',
		});
		runScript(SCRIPT_PATH, [], { cwd: folderPath, env: { npm_package_version: '0.2.0' } });
		expect(await readFile(path.join(folderPath, 'versions.json'), 'utf8')).toBe(
			'{"0.2.0":"1.0.0"}',
		);
		runScript(SCRIPT_PATH, [], { cwd: folderPath, env: { npm_package_version: '0.3.0' } });
		expect(JSON.parse(await readFile(path.join(folderPath, 'versions.json'), 'utf8'))).toEqual({
			'0.2.0': '1.0.0',
			'0.3.0': '1.15.0',
		});
	});

	it('writes tab-indented JSON with a trailing newline', async () => {
		const folderPath = await createFixtureFolder(FIXTURE);
		runScript(SCRIPT_PATH, [], { cwd: folderPath, env: { npm_package_version: '0.2.0' } });
		expect(await readFile(path.join(folderPath, 'manifest.json'), 'utf8')).toBe(
			'{\n\t"id": "task-orchestrator",\n\t"version": "0.2.0",\n\t"minAppVersion": "1.15.0"\n}\n',
		);
		expect(await readFile(path.join(folderPath, 'versions.json'), 'utf8')).toBe(
			'{\n\t"0.1.0": "1.15.0",\n\t"0.2.0": "1.15.0"\n}\n',
		);
	});

	it('fails without npm_package_version', async () => {
		const folderPath = await createFixtureFolder(FIXTURE);
		const run = runScript(SCRIPT_PATH, [], {
			cwd: folderPath,
			env: { npm_package_version: '' },
		});
		expect(run.exitCode).toBe(1);
	});
});
