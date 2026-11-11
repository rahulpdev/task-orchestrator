import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
	createFixtureFolder,
	removeFixtureFolders,
	runScript,
} from './test-helpers/fixture-folder.ts';

const SCRIPT_PATH = path.resolve(import.meta.dirname, 'check-manifest.ts');

const VALID_MANIFEST = {
	id: 'task-orchestrator',
	name: 'Personal Task Orchestrator',
	version: '0.1.0',
	minAppVersion: '1.15.0',
	description: 'Capture everything in one place and review it every week.',
	author: 'Rahul Parmar',
	isDesktopOnly: true,
};

function repositoryFiles(
	manifestChanges: Readonly<Record<string, unknown>> = {},
	fileChanges: Readonly<Record<string, string>> = {},
): Record<string, string> {
	return {
		'manifest.json': JSON.stringify({ ...VALID_MANIFEST, ...manifestChanges }),
		'versions.json': '{"0.1.0":"1.15.0"}',
		'package.json': '{"version":"0.1.0"}',
		'packages/core/package.json': '{"version":"0.1.0"}',
		'README.md': '# Readme\n',
		LICENSE: 'Elastic License 2.0\n',
		...fileChanges,
	};
}

async function check(
	files: Readonly<Record<string, string>>,
	scriptArguments: readonly string[] = [],
) {
	return runScript(SCRIPT_PATH, scriptArguments, { cwd: await createFixtureFolder(files) });
}

afterEach(removeFixtureFolders);

describe('check-manifest', () => {
	it('passes a valid repository and a matching tag', async () => {
		expect((await check(repositoryFiles(), ['--tag', '0.1.0'])).exitCode).toBe(0);
	});

	it.each<[string, Readonly<Record<string, unknown>>, string]>([
		['an id with capitals', { id: 'Task-Orchestrator' }, '"id"'],
		['an id ending in plugin', { id: 'tasks-plugin' }, '"id"'],
		['a name containing Obsidian', { name: 'Obsidian Tasks' }, '"name"'],
		['a name with non-Latin letters', { name: 'Tâches' }, '"name"'],
		['a description without a final period', { description: 'Capture everything' }, 'period'],
		['a description in lower case', { description: 'capture everything you need.' }, 'capital'],
		['a description with emoji', { description: 'Capture everything you need ✅.' }, 'emoji'],
		['a long description', { description: `${'A'.repeat(250)}.` }, '250'],
		[
			'a sample description',
			{ description: 'This is a plugin for tasks.' },
			'This is a plugin',
		],
		['a bad version', { version: '1.0' }, '"version"'],
		['a mobile manifest', { isDesktopOnly: false }, 'isDesktopOnly'],
		['an unknown key', { homepage: 'https://example.com' }, 'unexpected key'],
		['the sample funding URL', { fundingUrl: 'https://obsidian.md/pricing' }, 'fundingUrl'],
		['the sample author URL', { authorUrl: 'https://obsidian.md' }, 'authorUrl'],
		['a number for the author', { author: 42 }, '"author"'],
	])('fails %s and names the problem', async (_label, manifestChanges, expectedText) => {
		const run = await check(repositoryFiles(manifestChanges));
		expect(run.exitCode).toBe(1);
		expect(run.stderr).toContain(expectedText);
	});

	it.each<[string, Readonly<Record<string, string>>, string]>([
		[
			'a versions.json without the current version',
			{ 'versions.json': '{"0.0.9":"1.15.0"}' },
			'no entry',
		],
		[
			'a versions.json value that is not x.y.z',
			{ 'versions.json': '{"0.1.0":"latest"}' },
			'look like',
		],
		[
			'a package version that differs',
			{ 'packages/core/package.json': '{"version":"0.0.9"}' },
			'packages',
		],
		['a LICENSE that names Dynalist', { LICENSE: 'Copyright Dynalist Inc.\n' }, 'Dynalist'],
	])('fails %s and names the problem', async (_label, fileChanges, expectedText) => {
		const run = await check(repositoryFiles({}, fileChanges));
		expect(run.exitCode).toBe(1);
		expect(run.stderr).toContain(expectedText);
	});

	it('fails a missing README', async () => {
		const files = repositoryFiles();
		delete files['README.md'];
		const run = await check(files);
		expect(run.exitCode).toBe(1);
		expect(run.stderr).toContain('README.md: missing');
	});

	it('fails a tag that differs from the manifest version', async () => {
		const run = await check(repositoryFiles(), ['--tag', '0.2.0']);
		expect(run.exitCode).toBe(1);
		expect(run.stderr).toContain('--tag');
	});
});
