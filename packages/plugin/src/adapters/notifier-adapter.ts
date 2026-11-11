/**
 * Notices shown in Obsidian.
 *
 * @packageDocumentation
 */
import { Notice } from 'obsidian';
import type { NotifierPort } from '@task-orchestrator/core';

/**
 * Creates a notifier that shows each message as an Obsidian notice.
 *
 * @returns The notifier adapter.
 */
export function createObsidianNotifierAdapter(): NotifierPort {
	return {
		notice: (message) => {
			new Notice(message);
		},
	};
}
