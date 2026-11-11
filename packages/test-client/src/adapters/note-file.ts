/**
 * Reading and writing Markdown note files with YAML front matter, for the file-based adapters.
 *
 * Front matter is the YAML between a first line `---` and the next line `---`; the body is
 * everything after that closing line, kept byte for byte.
 *
 * @packageDocumentation
 */
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { frontMatterValuesEqual } from '@task-orchestrator/core';
import type {
	FrontMatter,
	FrontMatterExpectation,
	FrontMatterPatch,
	FrontMatterValue,
	VaultWriteOutcome,
} from '@task-orchestrator/core';
import { parse, stringify } from 'yaml';

/** A note file split into its front matter and body. */
export interface NoteFile {
	readonly frontMatter: FrontMatter;
	readonly body: string;
}

const FENCE = '---';
const FORBIDDEN_TITLE_CHARACTERS = /[\\/:*?"<>|#^[\]]/g;

/**
 * Splits a note's text into front matter and body. Never throws.
 *
 * @param noteText - The whole file.
 * @returns The front matter (empty when absent or not a YAML mapping) and the body.
 */
export function splitNote(noteText: string): NoteFile {
	const lines = noteText.split('\n');
	if (lines[0]?.trimEnd() !== FENCE) {
		return { frontMatter: {}, body: noteText };
	}
	const closingIndex = lines.findIndex(
		(line, lineIndex) => lineIndex > 0 && line.trimEnd() === FENCE,
	);
	if (closingIndex === -1) {
		return { frontMatter: {}, body: noteText };
	}
	let parsedYaml: unknown;
	try {
		parsedYaml = parse(lines.slice(1, closingIndex).join('\n'));
	} catch {
		parsedYaml = null;
	}
	return {
		frontMatter: toFrontMatter(parsedYaml),
		body: lines.slice(closingIndex + 1).join('\n'),
	};
}

/**
 * Joins front matter and body back into a note's text.
 *
 * @param frontMatter - The fields to write; none means no front matter block.
 * @param body - The body, written unchanged.
 * @returns The whole file.
 */
export function joinNote(frontMatter: FrontMatter, body: string): string {
	return Object.keys(frontMatter).length === 0
		? body
		: `${FENCE}\n${stringify(frontMatter)}${FENCE}\n${body}`;
}

/**
 * Keeps only the values front matter may hold; `null` and other values are dropped.
 *
 * @param parsedYaml - Whatever the YAML parser returned.
 * @returns The front matter, empty when the input is not a mapping.
 */
export function toFrontMatter(parsedYaml: unknown): FrontMatter {
	if (typeof parsedYaml !== 'object' || parsedYaml === null || Array.isArray(parsedYaml)) {
		return {};
	}
	const frontMatter: Record<string, FrontMatterValue> = {};
	for (const [fieldName, fieldValue] of Object.entries(parsedYaml)) {
		const converted = toFrontMatterValue(fieldValue);
		if (converted !== undefined) {
			frontMatter[fieldName] = converted;
		}
	}
	return frontMatter;
}

function toFrontMatterValue(value: unknown): FrontMatterValue | undefined {
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return value;
	}
	if (Array.isArray(value)) {
		return value.flatMap((item: unknown) => {
			const converted = toFrontMatterValue(item);
			return converted === undefined ? [] : [converted];
		});
	}
	if (typeof value === 'object' && value !== null) {
		return toFrontMatter(value);
	}
	return undefined;
}

/**
 * Applies a patch field by field with the shared conflict rule: a field is changed only when
 * it has no expectation or still holds the expected value.
 *
 * @param frontMatter - The current front matter.
 * @param patch - Fields to set; `null` removes a field.
 * @param expected - The value each field should hold now; `null` means absent.
 * @returns The new front matter and the write outcome.
 */
export function applyFrontMatterPatch(
	frontMatter: FrontMatter,
	patch: FrontMatterPatch,
	expected: FrontMatterExpectation,
): { readonly frontMatter: FrontMatter; readonly outcome: VaultWriteOutcome } {
	const updated = new Map<string, FrontMatterValue>(Object.entries(frontMatter));
	const appliedFields: string[] = [];
	const conflictingFields: string[] = [];
	for (const [fieldName, newValue] of Object.entries(patch)) {
		const expectedValue = expected[fieldName];
		if (
			expectedValue !== undefined &&
			!frontMatterValuesEqual(updated.get(fieldName), expectedValue)
		) {
			conflictingFields.push(fieldName);
			continue;
		}
		if (newValue === null) {
			updated.delete(fieldName);
		} else {
			updated.set(fieldName, newValue);
		}
		appliedFields.push(fieldName);
	}
	return {
		frontMatter: Object.fromEntries(updated),
		outcome: { status: 'written', appliedFields, conflictingFields },
	};
}

/**
 * Removes characters a note title may not contain.
 *
 * @param title - The requested title.
 * @returns The title without `\ / : * ? " < > | # ^ [ ]`, or `Untitled` when nothing is left.
 */
export function sanitiseTitle(title: string): string {
	const cleaned = title.replace(FORBIDDEN_TITLE_CHARACTERS, ' ').replace(/\s+/g, ' ').trim();
	return cleaned === '' ? 'Untitled' : cleaned;
}

/**
 * Writes a file through a temporary file and a rename, so readers never see half a file.
 *
 * @param filePath - The file to replace.
 * @param contents - The complete new contents.
 * @returns A promise that settles once the file is in place.
 */
export async function writeFileAtomically(filePath: string, contents: string): Promise<void> {
	await mkdir(path.dirname(filePath), { recursive: true });
	const temporaryPath = `${filePath}.tmp`;
	await writeFile(temporaryPath, contents, 'utf8');
	await rename(temporaryPath, filePath);
}
