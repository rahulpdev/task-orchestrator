/**
 * Gives the real-Obsidian tests the plugin's own type when they reach it through
 * `executeObsidian(({ plugins }) => plugins.taskOrchestrator)`, so no type assertion is needed.
 */
import type TaskOrchestratorPlugin from '../packages/plugin/src/main.ts';

declare module 'wdio-obsidian-service' {
	interface InstalledPlugins {
		taskOrchestrator: TaskOrchestratorPlugin;
	}
}
