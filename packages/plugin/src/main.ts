import { Plugin } from 'obsidian';
import { createCore, DEFAULT_USER_SETTINGS } from '@task-orchestrator/core';
import type { Core, CoreAdapters, UserSettings } from '@task-orchestrator/core';
import { createObsidianAdapters } from './adapters/index.ts';
import { registerCommands } from './commands.ts';
import { loadUserSettings } from './settings/settings-state.ts';
import { TaskOrchestratorSettingTab } from './settings/settings-tab.ts';

/**
 * Entry point Obsidian loads for Personal Task Orchestrator.
 *
 * Holds lifecycle code only; feature logic lives in the application core. Nothing is kept at
 * module level, so loading and unloading can repeat safely.
 */
export default class TaskOrchestratorPlugin extends Plugin {
	private loadedCore: Core | null = null;
	private loadedAdapters: CoreAdapters | null = null;
	/** The settings in use, kept in memory; saved only through the core, never to `data.json`. */
	override settings: UserSettings = DEFAULT_USER_SETTINGS;

	/**
	 * The application core. The real-Obsidian tests read it.
	 *
	 * @returns The core created in `onload`.
	 * @throws Error when read before the plugin has loaded.
	 */
	get core(): Core {
		if (this.loadedCore === null) {
			throw new Error('Personal Task Orchestrator has not loaded yet.');
		}
		return this.loadedCore;
	}

	/**
	 * The port adapters given to the core. The real-Obsidian tests read them.
	 *
	 * @returns The adapters created in `onload`.
	 * @throws Error when read before the plugin has loaded.
	 */
	get adapters(): CoreAdapters {
		if (this.loadedAdapters === null) {
			throw new Error('Personal Task Orchestrator has not loaded yet.');
		}
		return this.loadedAdapters;
	}

	/**
	 * Builds the adapters and the core, loads settings, and registers the command and the
	 * settings tab. Anything expensive waits for the workspace layout to be ready.
	 *
	 * @returns A promise that settles once the plugin has finished loading.
	 */
	override async onload(): Promise<void> {
		const obsidianAdapters = createObsidianAdapters(this, {
			currentMinimumLevel: () => this.settings.minimumLogLevel,
			getLogger: () => this.loadedCore?.logger ?? null,
		});
		// The log sink applies the user's minimum level, so the core passes every line to it.
		const core = createCore(obsidianAdapters.adapters, { minimumLogLevel: 'debug' });
		this.loadedCore = core;
		this.loadedAdapters = obsidianAdapters.adapters;
		this.register(() => {
			void obsidianAdapters.flushLog();
		});
		const { notifier } = obsidianAdapters.adapters;
		this.settings = await loadUserSettings(core, notifier);
		registerCommands(this, core, () => core.messagesFor(this.settings.language), notifier);
		this.addSettingTab(
			new TaskOrchestratorSettingTab(this.app, this, {
				core,
				notifier,
				currentSettings: () => this.settings,
				applySettings: (settings) => {
					this.settings = settings;
				},
			}),
		);
		core.logger.info('plugin.lifecycle.load_completed', {
			pluginVersion: this.manifest.version,
		});
		this.app.workspace.onLayoutReady(() => {
			core.logger.info('plugin.lifecycle.layout_ready');
		});
	}

	/**
	 * Reloads settings when a sync tool changes the plugin's data. Settings changed in
	 * `settings.json` are otherwise picked up at the next load, until the vault slice watches
	 * the store.
	 *
	 * @returns A promise that settles once the settings are reloaded.
	 */
	override async onExternalSettingsChange(): Promise<void> {
		if (this.loadedCore !== null && this.loadedAdapters !== null) {
			this.settings = await loadUserSettings(this.loadedCore, this.loadedAdapters.notifier);
		}
	}
}
