/**
 * The plugin's commands.
 *
 * @packageDocumentation
 */
import type { Plugin } from 'obsidian';
import type { Core, MessageCatalogue, NotifierPort } from '@task-orchestrator/core';
import { describeError, noticeForError } from './notices.ts';

/**
 * Registers every command. Command IDs never repeat the plugin ID, and no command has a
 * default hotkey.
 *
 * @param commandHost - The plugin, for `addCommand`.
 * @param core - The application core.
 * @param getMessages - The catalogue for the user's current language.
 * @param notifier - Shows the command's result.
 */
export function registerCommands(
	commandHost: Pick<Plugin, 'addCommand'>,
	core: Core,
	getMessages: () => MessageCatalogue,
	notifier: NotifierPort,
): void {
	commandHost.addCommand({
		id: 'ping',
		name: getMessages().commands.pingName,
		callback: () => {
			runPing(core, getMessages, notifier).catch((thrown: unknown) => {
				core.logger.error('plugin.command.ping_failed', {
					thrownError: describeError(thrown),
				});
				notifier.notice(getMessages().notices.operationFailed('CORE_INTERNAL_ERROR'));
			});
		},
	});
}

/**
 * Runs the `ping` operation and shows its result.
 *
 * @param core - The application core.
 * @param getMessages - The catalogue for the user's current language.
 * @param notifier - Shows the result.
 * @returns A promise that settles once the notice is shown.
 */
export async function runPing(
	core: Core,
	getMessages: () => MessageCatalogue,
	notifier: NotifierPort,
): Promise<void> {
	const result = await core.execute({ name: 'ping', version: 1, actor: 'user', payload: {} });
	const messages = getMessages();
	notifier.notice(
		result.ok
			? messages.notices.pingSucceeded
			: noticeForError(messages, result.error.errorCode),
	);
}
