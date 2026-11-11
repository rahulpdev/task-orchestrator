/**
 * The internal API: every request reaches the core as an envelope, is validated, runs one
 * registered operation or query, and comes back as a {@link Result}. Nothing escapes as an
 * exception.
 *
 * @packageDocumentation
 */
import * as z from 'zod';
import { CORE_ERROR_CODES, createAppError } from './errors.ts';
import type { AppError } from './errors.ts';
import { newCorrelationId } from './ids.ts';
import { describeThrown } from './logging.ts';
import type { Logger } from './logging.ts';
import type { ClockPort, CoreAdapters } from './ports.ts';

/** Who started a request. */
export type Actor = 'user' | 'application';

/** An operation may change state; a query only reads. */
export type OperationKind = 'operation' | 'query';

/** The shape every request must have before its payload is looked at. */
export const RequestEnvelopeSchema = z.object({
	name: z.string().min(1),
	version: z.number().int().positive(),
	actor: z.enum(['user', 'application']),
	correlationId: z.string().min(1).optional(),
	payload: z.unknown(),
});

/** A request envelope that passed {@link RequestEnvelopeSchema}. */
export type CoreRequest = z.infer<typeof RequestEnvelopeSchema>;

/** What `execute` and `query` return; the correlation ID is always present. */
export type Result<TOutcome> =
	| { readonly ok: true; readonly correlationId: string; readonly outcome: TOutcome }
	| { readonly ok: false; readonly correlationId: string; readonly error: AppError };

/** What a handler returns; the dispatcher adds the correlation ID. */
export type HandlerResult<TOutcome> =
	| { readonly ok: true; readonly outcome: TOutcome }
	| { readonly ok: false; readonly error: AppError };

/** Everything a handler may use while it runs. */
export interface OperationContext {
	readonly correlationId: string;
	readonly actor: Actor;
	/** A logger whose every line carries this request's correlation ID. */
	readonly log: Logger;
	readonly adapters: CoreAdapters;
}

/** One registered operation or query. */
export interface OperationDefinition<
	TName extends string = string,
	TKind extends OperationKind = OperationKind,
	TRequest extends z.ZodType = z.ZodType,
	TOutcome extends z.ZodType = z.ZodType,
> {
	readonly name: TName;
	readonly version: number;
	readonly kind: TKind;
	/** Schema the payload must pass before the handler runs. */
	readonly request: TRequest;
	/** Schema the handler's outcome must pass before it is returned. */
	readonly outcome: TOutcome;
	/**
	 * Does the work. Expected failures are returned as `{ ok: false }`, never thrown.
	 *
	 * @param payload - The validated payload.
	 * @param context - Correlation ID, actor, logger and adapters.
	 * @returns The outcome, or the expected failure.
	 */
	handler(
		payload: z.output<TRequest>,
		context: OperationContext,
	): Promise<HandlerResult<z.input<TOutcome>>>;
}

/** Registered definitions keyed by `name@version`. */
export type OperationRegistry = ReadonlyMap<string, OperationDefinition>;

/** The two entry points every host calls. Both never reject. */
export interface Dispatcher {
	/** Runs an operation; anything but a valid envelope is refused with `CORE_INPUT_INVALID`. */
	readonly execute: (rawRequest: unknown) => Promise<Result<unknown>>;
	/** Runs a query; anything but a valid envelope is refused with `CORE_INPUT_INVALID`. */
	readonly query: (rawRequest: unknown) => Promise<Result<unknown>>;
}

interface DispatchServices {
	readonly registry: OperationRegistry;
	readonly adapters: CoreAdapters;
	readonly logger: Logger;
	readonly clock: ClockPort;
}

/**
 * Declares an operation or query with typed payload and outcome.
 *
 * @param definition - Name, version, kind, schemas and handler.
 * @returns The same definition, typed for registration.
 */
export function defineOperation<
	const TName extends string,
	TKind extends OperationKind,
	TRequest extends z.ZodType,
	TOutcome extends z.ZodType,
>(
	definition: OperationDefinition<TName, TKind, TRequest, TOutcome>,
): OperationDefinition<TName, TKind, TRequest, TOutcome> {
	return definition;
}

/**
 * Builds the registry. A duplicate `name@version` is a programming error found at start-up.
 *
 * @param definitions - Every operation and query the core offers.
 * @returns The definitions keyed by `name@version`.
 * @throws Error when two definitions share a `name@version`.
 */
export function createOperationRegistry(
	definitions: readonly OperationDefinition[],
): OperationRegistry {
	const registry = new Map<string, OperationDefinition>();
	for (const definition of definitions) {
		const registryKey = `${definition.name}@${String(definition.version)}`;
		if (registry.has(registryKey)) {
			throw new Error(`Duplicate operation registration: ${registryKey}`);
		}
		registry.set(registryKey, definition);
	}
	return registry;
}

/**
 * Creates the dispatcher that validates requests, runs handlers and logs every step.
 *
 * @param registry - The registered operations and queries.
 * @param adapters - Passed to every handler.
 * @param logger - Base logger; each request gets a correlated child.
 * @param clock - Measures each request's duration.
 * @returns The `execute` and `query` entry points.
 */
export function createDispatcher(
	registry: OperationRegistry,
	adapters: CoreAdapters,
	logger: Logger,
	clock: ClockPort,
): Dispatcher {
	const services: DispatchServices = { registry, adapters, logger, clock };
	return {
		execute: (rawRequest) => dispatchSafely(services, 'operation', rawRequest),
		query: (rawRequest) => dispatchSafely(services, 'query', rawRequest),
	};
}

async function dispatchSafely(
	services: DispatchServices,
	entryKind: OperationKind,
	rawRequest: unknown,
): Promise<Result<unknown>> {
	const correlationId = pickCorrelationId(rawRequest);
	try {
		return await dispatch(services, entryKind, rawRequest, correlationId);
	} catch (thrown: unknown) {
		services.logger.withCorrelation(correlationId).error('core.api.dispatch_failed', {
			errorCode: CORE_ERROR_CODES.internalError,
			thrownError: describeThrown(thrown),
		});
		return failure(correlationId, internalError('The dispatcher failed unexpectedly.'));
	}
}

async function dispatch(
	services: DispatchServices,
	entryKind: OperationKind,
	rawRequest: unknown,
	correlationId: string,
): Promise<Result<unknown>> {
	const requestLog = services.logger.withCorrelation(correlationId);
	const envelope = RequestEnvelopeSchema.safeParse(rawRequest);
	if (!envelope.success) {
		return rejectRequest(requestLog, correlationId, entryKind, {
			issuePaths: issuePathsOf(envelope.error),
		});
	}
	const request = envelope.data;
	const definition = services.registry.get(`${request.name}@${String(request.version)}`);
	if (definition?.kind !== entryKind) {
		const reason = definition === undefined ? 'unknown_operation' : 'kind_mismatch';
		return rejectRequest(requestLog, correlationId, entryKind, {
			reason,
			operationName: request.name,
			operationVersion: request.version,
		});
	}
	const payload = definition.request.safeParse(request.payload);
	if (!payload.success) {
		return rejectRequest(requestLog, correlationId, entryKind, {
			operationName: request.name,
			operationVersion: request.version,
			issuePaths: issuePathsOf(payload.error),
		});
	}
	const context: OperationContext = {
		correlationId,
		actor: request.actor,
		log: requestLog,
		adapters: services.adapters,
	};
	return runHandler(services, definition, payload.data, context);
}

async function runHandler(
	services: DispatchServices,
	definition: OperationDefinition,
	payload: unknown,
	context: OperationContext,
): Promise<Result<unknown>> {
	const { correlationId, log } = context;
	const operationFields = {
		operationName: definition.name,
		operationVersion: definition.version,
		operationKind: definition.kind,
	};
	const startedAt = services.clock.now().getTime();
	log.info('core.api.operation_started', { ...operationFields, actor: context.actor });
	let handlerResult: HandlerResult<unknown>;
	try {
		handlerResult = await definition.handler(payload, context);
	} catch (thrown: unknown) {
		log.error('core.api.operation_failed', {
			...operationFields,
			errorCode: CORE_ERROR_CODES.internalError,
			thrownError: describeThrown(thrown),
		});
		return failure(correlationId, internalError('The handler threw an exception.'));
	}
	if (!handlerResult.ok) {
		const { errorCode, retryable } = handlerResult.error;
		log.warn('core.api.operation_failed', { ...operationFields, errorCode, retryable });
		return failure(correlationId, handlerResult.error);
	}
	const outcome = definition.outcome.safeParse(handlerResult.outcome);
	if (!outcome.success) {
		log.error('core.api.outcome_rejected', {
			...operationFields,
			issuePaths: issuePathsOf(outcome.error),
		});
		return failure(correlationId, internalError('The outcome failed its schema.'));
	}
	const durationMs = services.clock.now().getTime() - startedAt;
	log.info('core.api.operation_completed', { ...operationFields, durationMs });
	return { ok: true, correlationId, outcome: outcome.data };
}

function rejectRequest(
	requestLog: Logger,
	correlationId: string,
	entryKind: OperationKind,
	details: Readonly<Record<string, string | number | readonly string[]>>,
): Result<never> {
	requestLog.warn('core.api.request_rejected', { ...details, entryKind });
	return failure(
		correlationId,
		createAppError(
			CORE_ERROR_CODES.inputInvalid,
			'The request failed validation.',
			false,
			details,
		),
	);
}

function pickCorrelationId(rawRequest: unknown): string {
	if (typeof rawRequest === 'object' && rawRequest !== null && 'correlationId' in rawRequest) {
		const { correlationId } = rawRequest;
		if (typeof correlationId === 'string' && correlationId !== '') {
			return correlationId;
		}
	}
	return newCorrelationId();
}

function issuePathsOf(zodError: z.ZodError): string[] {
	return zodError.issues.map((issue) =>
		issue.path.length === 0 ? '(root)' : issue.path.map((segment) => String(segment)).join('.'),
	);
}

function internalError(message: string): AppError {
	return createAppError(CORE_ERROR_CODES.internalError, message, false);
}

function failure(correlationId: string, error: AppError): Result<never> {
	return { ok: false, correlationId, error };
}
