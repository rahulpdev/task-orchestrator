import { Plugin } from 'obsidian';

/**
 * Entry point Obsidian loads for Personal Task Orchestrator.
 *
 * Holds lifecycle code only; feature logic lives in the application core.
 */
export default class TaskOrchestratorPlugin extends Plugin {
	/**
	 * Called by Obsidian when the plugin is enabled.
	 *
	 * @returns A promise that settles once the plugin has finished loading.
	 */
	override async onload(): Promise<void> {}
}
