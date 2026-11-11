/**
 * Throwaway file that proves the workspace tooling works. Removed in Step 7.
 *
 * @packageDocumentation
 */

/** The shapes {@link sides} understands. */
export type Shape = 'circle' | 'square' | 'triangle';

/** Options with one optional label. */
export interface Options {
	readonly label?: string;
}

/**
 * Builds a greeting for the given name.
 *
 * @param name - Who to greet.
 * @returns The greeting text.
 */
export function greet(name: string): string {
	return `Hello, ${name}`;
}

/**
 * Returns the length of the first name in the list.
 *
 * @param names - Names to inspect.
 * @returns The first name's length, or 0 when the list is empty.
 */
export function firstLength(names: readonly string[]): number {
	const first = names[0];
	return first === undefined ? 0 : first.length;
}

/**
 * Builds options, leaving the label out when none is given.
 *
 * @param label - Optional label text.
 * @returns Options that carry the label only when it was supplied.
 */
export function buildOptions(label?: string): Options {
	return label === undefined ? {} : { label };
}

/**
 * Counts the straight sides of a shape.
 *
 * @param shape - The shape to count.
 * @returns The number of straight sides.
 */
export function sides(shape: Shape): number {
	switch (shape) {
		case 'circle':
			return 0;
		case 'square':
			return 4;
		case 'triangle':
			return 3;
		default: {
			const unhandled: never = shape;
			return unhandled;
		}
	}
}

/** Runs a callback after a delay; supplied by the host because the core owns no timers. */
export type Scheduler = (callback: () => void, delayMs: number) => void;

/**
 * Builds a greeting once a delay has passed.
 *
 * @param name - Who to greet.
 * @param delayMs - How long to wait, in milliseconds.
 * @param schedule - Runs the callback after the delay.
 * @returns A promise that resolves to the greeting after the delay.
 */
export function greetAfterDelay(
	name: string,
	delayMs: number,
	schedule: Scheduler,
): Promise<string> {
	return new Promise((resolve) => {
		schedule(() => {
			resolve(greet(name));
		}, delayMs);
	});
}

console.debug(greet('workspace'));
