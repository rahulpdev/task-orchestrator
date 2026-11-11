/**
 * Structured logging: every event becomes one JSON object (one line of JSON Lines) delivered to
 * a {@link LogSink}.
 *
 * Event names have three dot-separated parts, `domain.component.action_state`, for example
 * `core.api.operation_started`. Never log note content, licence keys or secrets.
 *
 * @packageDocumentation
 */
import type { ClockPort, LogSink } from './ports.ts';

/** How serious an event is, from least to most. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Sort order of the levels; an event is written when its level is at or above the minimum. */
export const LOG_LEVEL_ORDER: Readonly<Record<LogLevel, number>> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
};

/** A value a log line may carry. `null` is never written. */
export type LogFieldValue =
	| string
	| number
	| boolean
	| readonly LogFieldValue[]
	| { readonly [fieldName: string]: LogFieldValue };

/** Extra fields passed with an event; `null` and `undefined` values are dropped. */
export type LogFields = Readonly<Record<string, LogFieldValue | null | undefined>>;

/** One finished log line. */
export interface LogEvent {
	readonly event: string;
	readonly level: LogLevel;
	readonly timestamp: string;
	readonly correlationId?: string;
	readonly [fieldName: string]: LogFieldValue | undefined;
}

/** Settings for {@link createLogger}. */
export interface LoggerOptions {
	/** Events below this level are dropped. Defaults to `info`. */
	readonly minimumLevel?: LogLevel;
}

/** Writes structured events. Every method is safe to call: none of them throws. */
export interface Logger {
	/**
	 * Writes a `debug` event.
	 *
	 * @param eventName - Three-part event name, such as `core.api.operation_started`.
	 * @param fields - Extra fields for the line.
	 */
	debug(eventName: string, fields?: LogFields): void;
	/**
	 * Writes an `info` event.
	 *
	 * @param eventName - Three-part event name.
	 * @param fields - Extra fields for the line.
	 */
	info(eventName: string, fields?: LogFields): void;
	/**
	 * Writes a `warn` event.
	 *
	 * @param eventName - Three-part event name.
	 * @param fields - Extra fields for the line.
	 */
	warn(eventName: string, fields?: LogFields): void;
	/**
	 * Writes an `error` event.
	 *
	 * @param eventName - Three-part event name.
	 * @param fields - Extra fields for the line.
	 */
	error(eventName: string, fields?: LogFields): void;
	/**
	 * Creates a child logger whose every event carries the given correlation ID.
	 *
	 * @param correlationId - The ID to attach; an empty string means "no correlation ID".
	 * @returns A logger sharing this logger's sink, clock and minimum level.
	 */
	withCorrelation(correlationId: string): Logger;
}

const EVENT_NAME_PATTERN =
	/^[a-z][a-z0-9-]*\.[a-z][a-z0-9]*(?:_[a-z0-9]+)*\.[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
const RESERVED_FIELD_NAMES: ReadonlySet<string> = new Set([
	'event',
	'level',
	'timestamp',
	'correlationId',
]);
const REJECTED_EVENT_NAME = 'core.logging.event_rejected';

interface LoggerState {
	readonly logSink: LogSink;
	readonly clock: ClockPort;
	readonly minimumLevel: LogLevel;
	readonly correlationId: string | undefined;
}

/**
 * Checks that an event name has the three-part `domain.component.action_state` form.
 *
 * The domain may contain hyphens (`export-import`); the last part has at least two
 * snake-case words (`write_deferred`).
 *
 * @param eventName - The name to check.
 * @returns `true` when the name is valid.
 */
export function validateEventName(eventName: string): boolean {
	return EVENT_NAME_PATTERN.test(eventName);
}

/**
 * Describes a thrown value for a log line without assuming it is an `Error`.
 *
 * @param thrown - Whatever was thrown.
 * @returns Name, message and stack for an `Error`; the value's type otherwise.
 */
export function describeThrown(thrown: unknown): LogFieldValue {
	if (thrown instanceof Error) {
		const description = { errorName: thrown.name, errorMessage: thrown.message };
		return thrown.stack === undefined ? description : { ...description, stack: thrown.stack };
	}
	return { thrownValueType: thrown === null ? 'null' : typeof thrown };
}

/**
 * Creates a logger that writes one JSON object per event to the given sink.
 *
 * @param logSink - Where finished log lines are delivered.
 * @param clock - Source of the current time for each line's timestamp.
 * @param loggerOptions - Minimum level to write; lower levels are dropped.
 * @returns A logger whose events carry no correlation ID until `withCorrelation` is used.
 */
export function createLogger(
	logSink: LogSink,
	clock: ClockPort,
	loggerOptions: LoggerOptions = {},
): Logger {
	return buildLogger({
		logSink,
		clock,
		minimumLevel: loggerOptions.minimumLevel ?? 'info',
		correlationId: undefined,
	});
}

function buildLogger(state: LoggerState): Logger {
	return {
		debug: (eventName, fields) => {
			writeEvent(state, 'debug', eventName, fields);
		},
		info: (eventName, fields) => {
			writeEvent(state, 'info', eventName, fields);
		},
		warn: (eventName, fields) => {
			writeEvent(state, 'warn', eventName, fields);
		},
		error: (eventName, fields) => {
			writeEvent(state, 'error', eventName, fields);
		},
		withCorrelation: (correlationId) =>
			buildLogger({
				...state,
				correlationId: correlationId === '' ? undefined : correlationId,
			}),
	};
}

function writeEvent(
	state: LoggerState,
	level: LogLevel,
	eventName: string,
	fields: LogFields = {},
): void {
	if (!validateEventName(eventName)) {
		deliver(
			state,
			buildEvent(state, 'error', REJECTED_EVENT_NAME, { rejectedEventName: eventName }),
		);
		return;
	}
	if (LOG_LEVEL_ORDER[level] < LOG_LEVEL_ORDER[state.minimumLevel]) {
		return;
	}
	deliver(state, buildEvent(state, level, eventName, fields));
}

function buildEvent(
	state: LoggerState,
	level: LogLevel,
	eventName: string,
	fields: LogFields,
): LogEvent {
	const cleanFields: Record<string, LogFieldValue> = {};
	for (const [fieldName, fieldValue] of Object.entries(fields)) {
		if (
			fieldValue !== null &&
			fieldValue !== undefined &&
			!RESERVED_FIELD_NAMES.has(fieldName)
		) {
			cleanFields[fieldName] = fieldValue;
		}
	}
	const logEvent: LogEvent = {
		...cleanFields,
		event: eventName,
		level,
		timestamp: state.clock.now().toISOString(),
	};
	return state.correlationId === undefined
		? logEvent
		: { ...logEvent, correlationId: state.correlationId };
}

function deliver(state: LoggerState, logEvent: LogEvent): void {
	try {
		state.logSink.write(logEvent);
	} catch {
		// A failing sink must never break the caller, and there is nowhere left to report it.
	}
}
