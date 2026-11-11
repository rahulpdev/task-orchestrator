import path from 'node:path';
import { env } from 'node:process';
import { parseObsidianVersions } from 'wdio-obsidian-service';

const repositoryRoot = path.resolve(import.meta.dirname, '..');

// wdio-obsidian-service downloads official Obsidian builds into this git-ignored folder.
const cacheDir = path.resolve(repositoryRoot, '.wdio-obsidian-cache');

// `earliest` is the manifest's minAppVersion; `latest` is the newest public release. Beta
// versions are not tested: they need an Obsidian Insiders account.
const desktopVersions = await parseObsidianVersions(
	env.OBSIDIAN_VERSIONS ?? 'earliest/earliest latest/latest',
	{ cacheDir },
);

if (env.CI) {
	// Printed so the e2e workflow can key its cache on the resolved versions.
	console.debug('obsidian-cache-key:', JSON.stringify(desktopVersions));
}

export const config: WebdriverIO.Config = {
	runner: 'local',
	framework: 'mocha',
	specs: [path.join(import.meta.dirname, '**/*.e2e.ts')],
	maxInstances: Number(env.WDIO_MAX_INSTANCES ?? '4'),
	// Desktop only: the plugin is desktop-only, so there are no mobile capabilities.
	capabilities: desktopVersions.map<WebdriverIO.Capabilities>(
		([appVersion, installerVersion]) => ({
			browserName: 'obsidian',
			'wdio:obsidianOptions': {
				appVersion,
				installerVersion,
				plugins: [repositoryRoot],
				vault: path.join(repositoryRoot, 'test-vault'),
			},
		}),
	),
	services: ['obsidian'],
	reporters: ['obsidian'],
	mochaOpts: {
		ui: 'bdd',
		timeout: 60 * 1000,
	},
	waitforInterval: 250,
	waitforTimeout: 5 * 1000,
	logLevel: 'warn',
	cacheDir,
	injectGlobals: false,
};
