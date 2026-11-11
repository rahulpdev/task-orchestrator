/**
 * Ports: the interfaces the core uses to reach the outside world. Each host supplies one
 * adapter object per port. Adapters return outcome objects for expected conditions and throw
 * only for unexpected faults, which the dispatcher turns into `CORE_INTERNAL_ERROR`.
 *
 * @packageDocumentation
 */
import type { LogEvent } from './logging.ts';

/** A value a note's front matter may hold. */
export type FrontMatterValue =
	| string
	| number
	| boolean
	| readonly FrontMatterValue[]
	| { readonly [key: string]: FrontMatterValue };

/** A note's front matter: field name to value. */
export type FrontMatter = Readonly<Record<string, FrontMatterValue>>;

/** What the core knows about a managed note without reading its body. */
export interface NoteSnapshot {
	/** The note's front-matter `id`. */
	readonly noteId: string;
	/** Vault-relative path, such as `Projects/Kitchen.md`. */
	readonly notePath: string;
	readonly frontMatter: FrontMatter;
}

/** A managed note including its body, the text after the front matter. */
export interface NoteDocument extends NoteSnapshot {
	readonly body: string;
}

/** Fields to set; `null` removes the field. */
export type FrontMatterPatch = Readonly<Record<string, FrontMatterValue | null>>;

/** The values the caller believes each field holds now; `null` means "absent". */
export type FrontMatterExpectation = Readonly<Record<string, FrontMatterValue | null>>;

/** Result of a write to a note. */
export type VaultWriteOutcome =
	| {
			readonly status: 'written';
			readonly appliedFields: readonly string[];
			readonly conflictingFields: readonly string[];
	  }
	| { readonly status: 'deferred'; readonly reason: 'open_with_unsaved_changes' }
	| { readonly status: 'not_found' };

/** A change to a note made outside the core. */
export type VaultChange =
	| { readonly changeKind: 'changed'; readonly notePath: string }
	| {
			readonly changeKind: 'renamed';
			readonly notePath: string;
			readonly previousNotePath: string;
	  }
	| { readonly changeKind: 'deleted'; readonly notePath: string };

/** Access to the user's notes. */
export interface VaultPort {
	/**
	 * Lists every Markdown note whose front matter has a string `id`.
	 *
	 * @returns A snapshot of each managed note.
	 */
	listManaged(): Promise<readonly NoteSnapshot[]>;
	/**
	 * Reads one managed note.
	 *
	 * @param noteId - The note's front-matter `id`.
	 * @returns The note, or `null` when no managed note has this ID.
	 */
	read(noteId: string): Promise<NoteDocument | null>;
	/**
	 * Changes front-matter fields, each only if it still holds the expected value.
	 *
	 * A field with no entry in `expected` is applied unconditionally.
	 *
	 * @param noteId - The note's front-matter `id`.
	 * @param patch - Fields to set; `null` removes a field.
	 * @param expected - The value each field should hold now; `null` means absent.
	 * @returns Which fields were applied and which conflicted, or why nothing was written.
	 */
	patchFrontMatter(
		noteId: string,
		patch: FrontMatterPatch,
		expected: FrontMatterExpectation,
	): Promise<VaultWriteOutcome>;
	/**
	 * Replaces a note's body if it still matches the expected text.
	 *
	 * @param noteId - The note's front-matter `id`.
	 * @param newBody - The new body.
	 * @param expectedBody - The body the caller believes the note has now.
	 * @returns `written` with `body` applied or conflicting, or why nothing was written.
	 */
	replaceContent(
		noteId: string,
		newBody: string,
		expectedBody: string,
	): Promise<VaultWriteOutcome>;
	/**
	 * Creates a note. The front matter must hold a string `id`.
	 *
	 * @param request - Title (file name without `.md`), front matter and body.
	 * @returns The new note; a taken title gets a ` 2`, ` 3` suffix.
	 */
	create(request: {
		readonly title: string;
		readonly frontMatter: FrontMatter;
		readonly body: string;
	}): Promise<NoteSnapshot>;
	/**
	 * Renames a note in its folder.
	 *
	 * @param noteId - The note's front-matter `id`.
	 * @param newTitle - The new file name without `.md`.
	 * @returns The renamed note, or `null` when no managed note has this ID.
	 */
	rename(noteId: string, newTitle: string): Promise<NoteSnapshot | null>;
	/**
	 * Moves a note to the trash.
	 *
	 * @param noteId - The note's front-matter `id`.
	 * @returns `true` when the note was trashed, `false` when it was not found.
	 */
	trash(noteId: string): Promise<boolean>;
	/**
	 * Finds the managed note a wiki link points to.
	 *
	 * @param linkText - The link target as written, without brackets.
	 * @param sourceNotePath - Path of the note that holds the link.
	 * @returns The target note, or `null` when it is missing or not managed.
	 */
	resolveLink(linkText: string, sourceNotePath: string): Promise<NoteSnapshot | null>;
	/**
	 * Subscribes to changes made outside the core.
	 *
	 * @param listener - Called once per change.
	 * @returns A function that ends the subscription.
	 */
	onChange(listener: (vaultChange: VaultChange) => void): () => void;
}

/** Result of reading a store file. */
export type StoreReadOutcome =
	{ readonly status: 'found'; readonly contents: string } | { readonly status: 'missing' };

/** Plain files in the local store folder `.task-orchestrator/`; every path is relative to it. */
export interface StorePort {
	/**
	 * Reads a store file.
	 *
	 * @param storePath - Path relative to the store folder.
	 * @returns The contents, or `missing`.
	 */
	readFile(storePath: string): Promise<StoreReadOutcome>;
	/**
	 * Replaces a store file so readers see either the old or the new contents, never a mix.
	 *
	 * @param storePath - Path relative to the store folder.
	 * @param contents - The complete new contents.
	 * @returns A promise that settles once the file is written.
	 */
	writeFileAtomic(storePath: string, contents: string): Promise<void>;
	/**
	 * Appends one line, adding the trailing newline and creating missing folders.
	 *
	 * @param storePath - Path relative to the store folder.
	 * @param line - The line, without a newline.
	 * @returns A promise that settles once the line is written.
	 */
	appendLine(storePath: string, line: string): Promise<void>;
	/**
	 * Lists the names directly inside a store folder.
	 *
	 * @param storePath - Folder path relative to the store folder; `''` for the store itself.
	 * @returns File and folder names; empty when the folder does not exist.
	 */
	listFolder(storePath: string): Promise<readonly string[]>;
	/**
	 * Deletes a store file; deleting a missing file is not an error.
	 *
	 * @param storePath - Path relative to the store folder.
	 * @returns A promise that settles once the file is gone.
	 */
	deleteFile(storePath: string): Promise<void>;
}

/** Short messages shown to the user. */
export interface NotifierPort {
	/**
	 * Shows a short message.
	 *
	 * @param message - The text to show; taken from the messages catalogue.
	 */
	notice(message: string): void;
}

/** Result of storing a secret. */
export type SecretWriteOutcome = { readonly status: 'stored' } | { readonly status: 'unavailable' };

/** Secure storage for secrets such as licence keys; never plain text in a settings file. */
export interface SecretsPort {
	/**
	 * Reads a secret.
	 *
	 * @param secretId - The secret's name.
	 * @returns The secret, or `null` when it is not stored or storage is unavailable.
	 */
	get(secretId: string): Promise<string | null>;
	/**
	 * Stores a secret.
	 *
	 * @param secretId - The secret's name.
	 * @param secretValue - The secret itself; never logged.
	 * @returns `stored`, or `unavailable` when no secure storage exists (nothing is written).
	 */
	set(secretId: string, secretValue: string): Promise<SecretWriteOutcome>;
	/**
	 * Removes a secret; removing a missing secret is not an error.
	 *
	 * @param secretId - The secret's name.
	 * @returns A promise that settles once the secret is gone.
	 */
	delete(secretId: string): Promise<void>;
}

/** Receives finished log lines. */
export interface LogSink {
	/**
	 * Delivers one finished log line.
	 *
	 * @param logEvent - The complete event, ready to serialise as one JSON object.
	 */
	write(logEvent: LogEvent): void;
}

/** Source of the current time and the user's time zone. */
export interface ClockPort {
	/**
	 * Reads the current time.
	 *
	 * @returns The current moment.
	 */
	now(): Date;
	/**
	 * Reads the user's time zone.
	 *
	 * @returns An IANA zone name such as `Europe/London`.
	 */
	timezone(): string;
}

/** One adapter per port, supplied by the host when it creates the core. */
export interface CoreAdapters {
	readonly vault: VaultPort;
	readonly store: StorePort;
	readonly clock: ClockPort;
	readonly notifier: NotifierPort;
	readonly secrets: SecretsPort;
	readonly logSink: LogSink;
}

/**
 * The single conflict rule every vault adapter applies (TAD E7): does a field still hold the
 * value the caller expected? Compares by JSON value, with object keys in any order; a missing
 * field equals an expectation of `null`.
 *
 * @param currentValue - The field's current value, `undefined` when absent.
 * @param expectedValue - The expected value, `null` for "absent".
 * @returns `true` when the two are equal.
 */
export function frontMatterValuesEqual(
	currentValue: FrontMatterValue | undefined,
	expectedValue: FrontMatterValue | null,
): boolean {
	return stableJson(currentValue ?? null) === stableJson(expectedValue);
}

function stableJson(value: FrontMatterValue | null): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}
	if (isFrontMatterArray(value)) {
		return `[${value.map((item) => stableJson(item)).join(',')}]`;
	}
	const fieldNames = Object.keys(value).sort();
	const parts = fieldNames.map(
		(fieldName) => `${JSON.stringify(fieldName)}:${stableJson(value[fieldName] ?? null)}`,
	);
	return `{${parts.join(',')}}`;
}

function isFrontMatterArray(value: FrontMatterValue): value is readonly FrontMatterValue[] {
	return Array.isArray(value);
}
