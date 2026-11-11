/**
 * A notifier that records each notice and prints it to standard error.
 *
 * @packageDocumentation
 */
import process from 'node:process';
import type { NotifierPort } from '@task-orchestrator/core';

/** The notifier plus every notice it has shown, oldest first. */
export interface PrintingNotifier extends NotifierPort {
	readonly shownNotices: readonly string[];
}

/**
 * Creates a notifier that records notices and prints each as `notice: <text>` to standard error.
 *
 * @returns The printing notifier.
 */
export function createPrintingNotifier(): PrintingNotifier {
	const shownNotices: string[] = [];
	return {
		shownNotices,
		notice: (message) => {
			shownNotices.push(message);
			process.stderr.write(`notice: ${message}\n`);
		},
	};
}
