/**
 * Builds a greeting for the given name.
 *
 * @param name - Who to greet.
 * @returns The greeting text.
 */
export function greet(name: string): string {
	return `Hello, ${name}`;
}

console.debug(greet('workspace'));
