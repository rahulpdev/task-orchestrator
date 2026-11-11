import { describe, expect, it } from 'vitest';
import { applySettingsMigrations, parseSettingsFile } from './rules.ts';
import type { SettingsMigration } from './rules.ts';
import { DEFAULT_USER_SETTINGS } from './schemas.ts';

describe('parseSettingsFile', () => {
	it.each(['not json', '42', '[]', 'null', '{"language":"fr-FR"}', '{"minimumLogLevel":3}'])(
		'gives the defaults and corrupt for %j',
		(fileContents) => {
			expect(parseSettingsFile(fileContents)).toEqual({
				settings: DEFAULT_USER_SETTINGS,
				loadStatus: 'corrupt',
			});
		},
	);

	it('gives the defaults and valid for an empty object', () => {
		expect(parseSettingsFile('{}')).toEqual({
			settings: DEFAULT_USER_SETTINGS,
			loadStatus: 'valid',
		});
	});

	it('keeps keys it does not know', () => {
		const parsed = parseSettingsFile('{"language":"en-US","futureSetting":true}');
		expect(parsed.settings).toMatchObject({ language: 'en-US', futureSetting: true });
	});
});

describe('applySettingsMigrations', () => {
	const renameLanguage: SettingsMigration = {
		migrationName: '2026-11-use-us-english',
		migrate: (settings) => ({ ...settings, language: 'en-US' }),
	};

	it('runs a pending migration once and records its name', () => {
		const migrationRun = applySettingsMigrations(DEFAULT_USER_SETTINGS, [renameLanguage]);
		expect(migrationRun.settings).toMatchObject({
			language: 'en-US',
			appliedSettingsMigrations: ['2026-11-use-us-english'],
		});
		expect('migrationFailed' in migrationRun).toBe(false);
	});

	it('skips a migration already recorded, so a second run changes nothing', () => {
		const firstRun = applySettingsMigrations(DEFAULT_USER_SETTINGS, [renameLanguage]);
		const restored = { ...firstRun.settings, language: 'en-GB' as const };
		expect(applySettingsMigrations(restored, [renameLanguage]).settings).toEqual(restored);
	});

	it('reports a migration that throws and returns the settings unchanged', () => {
		const failing: SettingsMigration = {
			migrationName: 'broken-step',
			migrate: () => {
				throw new Error('broken');
			},
		};
		expect(applySettingsMigrations(DEFAULT_USER_SETTINGS, [renameLanguage, failing])).toEqual({
			settings: DEFAULT_USER_SETTINGS,
			migrationFailed: 'broken-step',
		});
	});
});
