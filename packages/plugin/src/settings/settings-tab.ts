/**
 * The plugin's settings tab, in Obsidian's declarative form (minimum app version 1.13.0+).
 *
 * @packageDocumentation
 */
import { PluginSettingTab } from 'obsidian';
import type { App, Plugin, SettingDefinitionItem } from 'obsidian';
import type { Core, Language, NotifierPort, UserSettings } from '@task-orchestrator/core';
import { describeError } from '../notices.ts';
import { saveSettingsChange } from './settings-state.ts';

/** What the settings tab needs from the plugin. */
export interface SettingsTabHost {
	readonly core: Core;
	readonly notifier: NotifierPort;
	/**
	 * Reads the settings the plugin holds in memory.
	 *
	 * @returns The current settings.
	 */
	currentSettings(): UserSettings;
	/**
	 * Replaces the settings the plugin holds in memory after a successful save.
	 *
	 * @param settings - The saved settings.
	 */
	applySettings(settings: UserSettings): void;
}

const LANGUAGE_KEY = 'language';

/** One dropdown for the language; every word comes from the messages catalogue. */
export class TaskOrchestratorSettingTab extends PluginSettingTab {
	private readonly settingsHost: SettingsTabHost;

	/**
	 * Creates the tab.
	 *
	 * @param app - The app instance.
	 * @param plugin - The plugin that owns the tab.
	 * @param settingsHost - Reads, saves and applies settings.
	 */
	constructor(app: App, plugin: Plugin, settingsHost: SettingsTabHost) {
		super(app, plugin);
		this.settingsHost = settingsHost;
	}

	/**
	 * Describes the tab's one setting. Reads only in-memory state, so it stays cheap.
	 *
	 * @returns The language dropdown.
	 */
	override getSettingDefinitions(): SettingDefinitionItem[] {
		const messages = this.settingsHost.core.messagesFor(
			this.settingsHost.currentSettings().language,
		);
		return [
			{
				name: messages.settings.languageName,
				desc: messages.settings.languageDescription,
				control: {
					type: 'dropdown',
					key: LANGUAGE_KEY,
					options: {
						'en-GB': messages.settings.languageOptionBritish,
						'en-US': messages.settings.languageOptionAmerican,
					},
				},
			},
		];
	}

	/**
	 * Reads a control's value from the plugin's in-memory settings.
	 *
	 * @param key - The control's key.
	 * @returns The value, or `undefined` for an unknown key.
	 */
	override getControlValue(key: string): unknown {
		return key === LANGUAGE_KEY ? this.settingsHost.currentSettings().language : undefined;
	}

	/**
	 * Saves a changed control value through the core, then redraws the tab in the new language.
	 *
	 * @param key - The control's key.
	 * @param value - The chosen value.
	 * @returns A promise that settles once the save has finished or failed.
	 */
	override async setControlValue(key: string, value: unknown): Promise<void> {
		if (key !== LANGUAGE_KEY || !isLanguage(value)) {
			return;
		}
		try {
			const { core, notifier } = this.settingsHost;
			const currentLanguage = this.settingsHost.currentSettings().language;
			const saved = await saveSettingsChange(
				core,
				notifier,
				{ language: value },
				currentLanguage,
			);
			if (saved !== null) {
				this.settingsHost.applySettings(saved);
				this.update();
			}
		} catch (thrown: unknown) {
			this.settingsHost.core.logger.error('plugin.settings.save_failed', {
				thrownError: describeError(thrown),
			});
		}
	}
}

function isLanguage(value: unknown): value is Language {
	return value === 'en-GB' || value === 'en-US';
}
