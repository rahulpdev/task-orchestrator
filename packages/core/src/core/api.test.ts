import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import { createDispatcher, createOperationRegistry, defineOperation } from './api.ts';
import type { Dispatcher, OperationDefinition, Result } from './api.ts';
import { pingOperation } from './diagnostics.ts';
import { createAppError } from './errors.ts';
import { createLogger } from './logging.ts';
import type { LogEvent } from './logging.ts';
import { createPretendClock, createRecordingLogSink, createTestAdapters } from './testing/index.ts';

const echoOperation = defineOperation({
	name: 'echo',
	version: 1,
	kind: 'operation',
	request: z.object({ text: z.string() }),
	outcome: z.object({ echoed: z.string() }),
	handler: (payload) => Promise.resolve({ ok: true, outcome: { echoed: payload.text } }),
});

const lookupQuery = defineOperation({
	name: 'lookup',
	version: 1,
	kind: 'query',
	request: z.object({}),
	outcome: z.object({ found: z.boolean() }),
	handler: () => Promise.resolve({ ok: true, outcome: { found: true } }),
});

function buildDispatcher(definitions: readonly OperationDefinition[]): {
	readonly dispatcher: Dispatcher;
	readonly lines: LogEvent[];
} {
	const logSink = createRecordingLogSink();
	const clock = createPretendClock('2026-11-10T09:30:00.000Z');
	const adapters = createTestAdapters({ logSink, clock });
	const logger = createLogger(logSink, clock, { minimumLevel: 'debug' });
	const dispatcher = createDispatcher(
		createOperationRegistry(definitions),
		adapters,
		logger,
		clock,
	);
	return { dispatcher, lines: logSink.lines };
}

function errorCodeOf(result: Result<unknown>): string | null {
	return result.ok ? null : result.error.errorCode;
}

describe('execute input validation', () => {
	it.each([
		['a missing actor', { name: 'echo', version: 1, payload: { text: 'hi' } }],
		['version 0', { name: 'echo', version: 0, actor: 'user', payload: { text: 'hi' } }],
		['a value that is not an object', 'not an envelope'],
	])('refuses an envelope with %s and never runs the handler', async (_label, rawRequest) => {
		const handler = vi.fn((payload: { readonly text: string }) =>
			Promise.resolve({ ok: true as const, outcome: { echoed: payload.text } }),
		);
		const { dispatcher, lines } = buildDispatcher([{ ...echoOperation, handler }]);
		const result = await dispatcher.execute(rawRequest);
		expect(errorCodeOf(result)).toBe('CORE_INPUT_INVALID');
		expect(handler).not.toHaveBeenCalled();
		expect(lines.map((line) => line.event)).toEqual(['core.api.request_rejected']);
	});

	it('refuses a payload that fails its schema and records only the failing paths', async () => {
		const handler = vi.fn((payload: { readonly text: string }) =>
			Promise.resolve({ ok: true as const, outcome: { echoed: payload.text } }),
		);
		const { dispatcher } = buildDispatcher([{ ...echoOperation, handler }]);
		const result = await dispatcher.execute({
			name: 'echo',
			version: 1,
			actor: 'user',
			payload: { text: 42 },
		});
		expect(result.ok ? null : result.error.details).toMatchObject({ issuePaths: ['text'] });
		expect(handler).not.toHaveBeenCalled();
	});

	it('refuses an unknown operation with reason unknown_operation', async () => {
		const { dispatcher } = buildDispatcher([echoOperation]);
		const result = await dispatcher.execute({
			name: 'nope',
			version: 1,
			actor: 'user',
			payload: {},
		});
		expect(result.ok ? null : result.error.details).toMatchObject({
			reason: 'unknown_operation',
		});
	});

	it('refuses a query sent to execute, and an operation sent to query, with kind_mismatch', async () => {
		const { dispatcher } = buildDispatcher([echoOperation, lookupQuery]);
		const queryThroughExecute = await dispatcher.execute({
			name: 'lookup',
			version: 1,
			actor: 'user',
			payload: {},
		});
		const operationThroughQuery = await dispatcher.query({
			name: 'echo',
			version: 1,
			actor: 'user',
			payload: { text: 'hi' },
		});
		for (const result of [queryThroughExecute, operationThroughQuery]) {
			expect(result.ok ? null : result.error.details).toMatchObject({
				reason: 'kind_mismatch',
			});
		}
	});
});

describe('execute failures inside the handler', () => {
	it('turns a thrown Error into CORE_INTERNAL_ERROR and logs its stack', async () => {
		const throwing = defineOperation({
			...echoOperation,
			handler: () => Promise.reject(new Error('boom')),
		});
		const { dispatcher, lines } = buildDispatcher([throwing]);
		const result = await dispatcher.execute({
			name: 'echo',
			version: 1,
			actor: 'user',
			payload: { text: 'hi' },
		});
		expect(errorCodeOf(result)).toBe('CORE_INTERNAL_ERROR');
		const failureLine = lines.find((line) => line.event === 'core.api.operation_failed');
		expect(failureLine?.thrownError).toHaveProperty('stack');
	});

	it('describes a thrown string by its type', async () => {
		const throwingString = defineOperation({
			...echoOperation,
			handler: () => {
				throw 'plain text'; // eslint-disable-line @typescript-eslint/only-throw-error -- the test proves a thrown non-Error value is handled
			},
		});
		const { dispatcher, lines } = buildDispatcher([throwingString]);
		const result = await dispatcher.execute({
			name: 'echo',
			version: 1,
			actor: 'user',
			payload: { text: 'hi' },
		});
		expect(errorCodeOf(result)).toBe('CORE_INTERNAL_ERROR');
		const failureLine = lines.find((line) => line.event === 'core.api.operation_failed');
		expect(failureLine?.thrownError).toEqual({ thrownValueType: 'string' });
	});

	it('returns an expected failure as it is and logs it at warn', async () => {
		const refusing = defineOperation({
			...echoOperation,
			handler: () =>
				Promise.resolve({
					ok: false,
					error: createAppError('CORE_TARGET_NOT_FOUND', 'Missing.', false),
				}),
		});
		const { dispatcher, lines } = buildDispatcher([refusing]);
		const result = await dispatcher.execute({
			name: 'echo',
			version: 1,
			actor: 'user',
			payload: { text: 'hi' },
		});
		expect(errorCodeOf(result)).toBe('CORE_TARGET_NOT_FOUND');
		const failureLine = lines.find((line) => line.event === 'core.api.operation_failed');
		expect(failureLine).toMatchObject({ level: 'warn', errorCode: 'CORE_TARGET_NOT_FOUND' });
	});

	it('turns an outcome that fails its schema into CORE_INTERNAL_ERROR', async () => {
		const badOutcome = defineOperation({
			...echoOperation,
			outcome: z.object({ echoed: z.number() }),
			handler: () => Promise.resolve({ ok: true, outcome: { echoed: Number.NaN } }),
		});
		const { dispatcher, lines } = buildDispatcher([badOutcome]);
		const result = await dispatcher.execute({
			name: 'echo',
			version: 1,
			actor: 'user',
			payload: { text: 'hi' },
		});
		expect(errorCodeOf(result)).toBe('CORE_INTERNAL_ERROR');
		expect(lines.some((line) => line.event === 'core.api.outcome_rejected')).toBe(true);
	});
});

describe('correlation IDs', () => {
	it('puts a supplied correlation ID on the result and on every log line', async () => {
		const { dispatcher, lines } = buildDispatcher([echoOperation]);
		const result = await dispatcher.execute({
			name: 'echo',
			version: 1,
			actor: 'user',
			correlationId: 'supplied-id',
			payload: { text: 'hi' },
		});
		expect(result.correlationId).toBe('supplied-id');
		expect(lines.length).toBeGreaterThan(0);
		expect(lines.every((line) => line.correlationId === 'supplied-id')).toBe(true);
	});

	it('generates one correlation ID when none is supplied and uses it everywhere', async () => {
		const { dispatcher, lines } = buildDispatcher([echoOperation]);
		const result = await dispatcher.execute({
			name: 'echo',
			version: 1,
			actor: 'user',
			payload: { text: 'hi' },
		});
		expect(result.correlationId).not.toBe('');
		expect(lines.every((line) => line.correlationId === result.correlationId)).toBe(true);
	});

	it('returns the correlation ID carried by a malformed envelope', async () => {
		const { dispatcher } = buildDispatcher([echoOperation]);
		const result = await dispatcher.execute({ correlationId: 'from-bad-envelope', version: 0 });
		expect(result).toMatchObject({ ok: false, correlationId: 'from-bad-envelope' });
	});
});

describe('successful requests', () => {
	it('logs start and completion with the duration', async () => {
		const { dispatcher, lines } = buildDispatcher([echoOperation]);
		const result = await dispatcher.execute({
			name: 'echo',
			version: 1,
			actor: 'application',
			payload: { text: 'hi' },
		});
		expect(result).toMatchObject({ ok: true, outcome: { echoed: 'hi' } });
		expect(lines.map((line) => line.event)).toEqual([
			'core.api.operation_started',
			'core.api.operation_completed',
		]);
		expect(lines[0]).toMatchObject({ operationName: 'echo', actor: 'application' });
		expect(lines[1]).toMatchObject({ durationMs: 0 });
	});

	it('runs a query through query and marks its lines as a query', async () => {
		const { dispatcher, lines } = buildDispatcher([lookupQuery]);
		const result = await dispatcher.query({
			name: 'lookup',
			version: 1,
			actor: 'user',
			payload: {},
		});
		expect(result).toMatchObject({ ok: true, outcome: { found: true } });
		expect(lines.every((line) => line.operationKind === 'query')).toBe(true);
	});

	it('ping returns the clock time', async () => {
		const { dispatcher } = buildDispatcher([pingOperation]);
		const result = await dispatcher.execute({
			name: 'ping',
			version: 1,
			actor: 'user',
			payload: {},
		});
		expect(result).toMatchObject({
			ok: true,
			outcome: { respondedAt: '2026-11-10T09:30:00.000Z' },
		});
	});
});

describe('createOperationRegistry', () => {
	it('throws at construction when a name and version are registered twice', () => {
		expect(() => createOperationRegistry([echoOperation, echoOperation])).toThrow(/echo@1/);
	});

	it('accepts the same name with a different version', () => {
		expect(
			createOperationRegistry([echoOperation, { ...echoOperation, version: 2 }]).size,
		).toBe(2);
	});
});
