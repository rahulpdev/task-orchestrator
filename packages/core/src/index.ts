/**
 * Public surface of the Personal Task Orchestrator application core.
 *
 * Hosts (the plugin and the test client) create the core with one adapter per port and then
 * reach it only through `execute` and `query`.
 *
 * @packageDocumentation
 */
import type * as z from 'zod';
import { createDispatcher, createOperationRegistry } from './core/api.ts';
import type { Result } from './core/api.ts';
import { pingOperation } from './core/diagnostics.ts';
import { createLogger } from './core/logging.ts';
import type { Logger, LogLevel } from './core/logging.ts';
import { messagesFor } from './core/messages/index.ts';
import type { Language, MessageCatalogue } from './core/messages/index.ts';
import type { CoreAdapters } from './core/ports.ts';
import { settingsOperations } from './settings/index.ts';

export { frontMatterValuesEqual } from './core/ports.ts';
export { DEFAULT_USER_SETTINGS } from './settings/index.ts';

export type { Actor, CoreRequest, OperationKind, Result } from './core/api.ts';
export type { AppError } from './core/errors.ts';
export type { LogEvent, LogFields, LogFieldValue, Logger, LogLevel } from './core/logging.ts';
export type { KnownErrorCode, Language, MessageCatalogue } from './core/messages/index.ts';
export type {
	ClockPort,
	CoreAdapters,
	FrontMatter,
	FrontMatterExpectation,
	FrontMatterPatch,
	FrontMatterValue,
	LogSink,
	NoteDocument,
	NoteSnapshot,
	NotifierPort,
	SecretsPort,
	SecretWriteOutcome,
	StorePort,
	StoreReadOutcome,
	VaultChange,
	VaultPort,
	VaultWriteOutcome,
} from './core/ports.ts';
export type { SettingsChange, UserSettings } from './settings/index.ts';

const CORE_OPERATIONS = [pingOperation, ...settingsOperations] as const;

type CoreOperation = (typeof CORE_OPERATIONS)[number];

/** The name of every registered definition of the given kind. */
export type OperationName<TKind extends CoreOperation['kind']> = Extract<
	CoreOperation,
	{ readonly kind: TKind }
>['name'];

type DefinitionNamed<TName extends CoreOperation['name']> = Extract<
	CoreOperation,
	{ readonly name: TName }
>;

/** The payload a named operation or query accepts. */
export type OperationPayload<TName extends CoreOperation['name']> = z.input<
	DefinitionNamed<TName>['request']
>;

/** The outcome a named operation or query returns on success. */
export type OperationOutcome<TName extends CoreOperation['name']> = z.output<
	DefinitionNamed<TName>['outcome']
>;

/** A request for a known operation or query, typed by its name. */
export interface TypedRequest<TName extends CoreOperation['name']> {
	readonly name: TName;
	readonly version: number;
	readonly actor: 'user' | 'application';
	readonly correlationId?: string;
	readonly payload: OperationPayload<TName>;
}

/** Settings for {@link createCore}. */
export interface CoreOptions {
	/** Lines below this level are dropped before they reach the log sink. Defaults to `info`. */
	readonly minimumLogLevel?: LogLevel;
}

/** The application core as a host sees it. */
export interface Core {
	/**
	 * Runs an operation. A request typed by name gets a typed outcome; anything else is
	 * validated at run time and refused with `CORE_INPUT_INVALID` if it is not a valid envelope.
	 *
	 * @param request - The request envelope.
	 * @returns The result; never rejects.
	 */
	execute<TName extends OperationName<'operation'>>(
		request: TypedRequest<TName>,
	): Promise<Result<OperationOutcome<TName>>>;
	execute(request: unknown): Promise<Result<unknown>>;
	/**
	 * Runs a query, which reads and never changes anything.
	 *
	 * @param request - The request envelope.
	 * @returns The result; never rejects.
	 */
	query<TName extends OperationName<'query'>>(
		request: TypedRequest<TName>,
	): Promise<Result<OperationOutcome<TName>>>;
	query(request: unknown): Promise<Result<unknown>>;
	/** Lets the host write its own events (`plugin.*`, `test-client.*`) in the same line format. */
	readonly logger: Logger;
	/**
	 * Gives the host the words to show, so no host holds wording of its own.
	 *
	 * @param language - The language from the user's settings.
	 * @returns The catalogue for that language.
	 */
	messagesFor(language: Language): MessageCatalogue;
}

/**
 * Creates the application core.
 *
 * @param adapters - One adapter per port, supplied by the host.
 * @param coreOptions - The minimum log level.
 * @returns The core, ready to take requests.
 * @throws Error when two registered definitions share a `name@version` (a programming error).
 */
export function createCore(adapters: CoreAdapters, coreOptions: CoreOptions = {}): Core {
	const logger = createLogger(adapters.logSink, adapters.clock, {
		minimumLevel: coreOptions.minimumLogLevel ?? 'info',
	});
	const dispatcher = createDispatcher(
		createOperationRegistry(CORE_OPERATIONS),
		adapters,
		logger,
		adapters.clock,
	);
	return {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the dispatcher has already validated each outcome against the named definition's own outcome schema, which is what the typed overload promises
		execute: dispatcher.execute as Core['execute'],
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- as above: each outcome is validated against the named definition's own outcome schema
		query: dispatcher.query as Core['query'],
		logger,
		messagesFor,
	};
}
