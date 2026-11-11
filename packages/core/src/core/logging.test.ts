import { describe, expect, it } from 'vitest';
import { createLogger, describeThrown, validateEventName } from './logging.ts';
import type { LogEvent, LogLevel } from './logging.ts';
import type { ClockPort, LogSink } from './ports.ts';

const FIXED_TIME = new Date('2026-11-10T09:30:00.000Z');

function createFixedClock(): ClockPort {
	return { now: () => new Date(FIXED_TIME), timezone: () => 'Europe/London' };
}

function createRecordingSink(): { readonly logSink: LogSink; readonly lines: LogEvent[] } {
	const lines: LogEvent[] = [];
	return {
		lines,
		logSink: {
			write: (logEvent) => {
				lines.push(logEvent);
			},
		},
	};
}

describe('createLogger', () => {
	it('writes one object with the event name, level, UTC timestamp and fields', () => {
		const { logSink, lines } = createRecordingSink();
		createLogger(logSink, createFixedClock()).info('core.api.operation_started', {
			operationName: 'ping',
		});
		expect(lines).toEqual([
			{
				event: 'core.api.operation_started',
				level: 'info',
				timestamp: '2026-11-10T09:30:00.000Z',
				operationName: 'ping',
			},
		]);
		expect(lines[0]?.timestamp.endsWith('Z')).toBe(true);
	});

	it('leaves the correlationId key out when none is set', () => {
		const { logSink, lines } = createRecordingSink();
		createLogger(logSink, createFixedClock()).info('core.api.operation_started');
		expect('correlationId' in (lines[0] ?? {})).toBe(false);
	});

	it('adds the correlation ID to every event of a correlated child logger', () => {
		const { logSink, lines } = createRecordingSink();
		const operationLog = createLogger(logSink, createFixedClock()).withCorrelation('abc-123');
		operationLog.info('core.api.operation_started');
		operationLog.warn('core.api.operation_failed');
		expect(lines.map((line) => line.correlationId)).toEqual(['abc-123', 'abc-123']);
	});

	it('treats an empty correlation ID as unset and leaves the key out', () => {
		const { logSink, lines } = createRecordingSink();
		createLogger(logSink, createFixedClock())
			.withCorrelation('')
			.info('core.api.operation_started');
		expect('correlationId' in (lines[0] ?? {})).toBe(false);
	});

	it('drops null and undefined field values', () => {
		const { logSink, lines } = createRecordingSink();
		createLogger(logSink, createFixedClock()).info('core.api.operation_started', {
			keptField: 'kept',
			nullField: null,
			undefinedField: undefined,
		});
		expect(Object.keys(lines[0] ?? {}).sort()).toEqual([
			'event',
			'keptField',
			'level',
			'timestamp',
		]);
	});

	it('never lets fields override the reserved keys', () => {
		const { logSink, lines } = createRecordingSink();
		createLogger(logSink, createFixedClock()).info('core.api.operation_started', {
			event: 'other.event.name_changed',
			level: 'error',
			timestamp: 'yesterday',
			correlationId: 'forged',
		});
		expect(lines[0]).toEqual({
			event: 'core.api.operation_started',
			level: 'info',
			timestamp: '2026-11-10T09:30:00.000Z',
		});
	});

	it.each<[LogLevel, LogLevel[]]>([
		['debug', ['debug', 'info', 'warn', 'error']],
		['info', ['info', 'warn', 'error']],
		['warn', ['warn', 'error']],
		['error', ['error']],
	])('at minimum level %s writes only %j', (minimumLevel, writtenLevels) => {
		const { logSink, lines } = createRecordingSink();
		const logger = createLogger(logSink, createFixedClock(), { minimumLevel });
		logger.debug('core.test.level_checked');
		logger.info('core.test.level_checked');
		logger.warn('core.test.level_checked');
		logger.error('core.test.level_checked');
		expect(lines.map((line) => line.level)).toEqual(writtenLevels);
	});

	it('drops debug events by default', () => {
		const { logSink, lines } = createRecordingSink();
		createLogger(logSink, createFixedClock()).debug('core.test.level_checked');
		expect(lines).toEqual([]);
	});

	it('writes one event_rejected line instead of an event with an invalid name', () => {
		const { logSink, lines } = createRecordingSink();
		createLogger(logSink, createFixedClock()).withCorrelation('abc-123').info('started');
		expect(lines).toEqual([
			{
				event: 'core.logging.event_rejected',
				level: 'error',
				timestamp: '2026-11-10T09:30:00.000Z',
				rejectedEventName: 'started',
				correlationId: 'abc-123',
			},
		]);
	});

	it('does not throw when the sink throws', () => {
		const throwingSink: LogSink = {
			write: () => {
				throw new Error('disk full');
			},
		};
		const logger = createLogger(throwingSink, createFixedClock());
		expect(() => {
			logger.info('core.api.operation_started');
		}).not.toThrow();
	});
});

describe('validateEventName', () => {
	it.each([
		'core.jobs.tick_completed',
		'core.vault.write_deferred',
		'capture.note.creation_started',
		'export-import.archive.copy_failed',
	])('accepts %s', (eventName) => {
		expect(validateEventName(eventName)).toBe(true);
	});

	it.each(['validation_started', 'core.started', 'Core.api.x_started', 'a.b.c.d_started'])(
		'rejects %s',
		(eventName) => {
			expect(validateEventName(eventName)).toBe(false);
		},
	);
});

describe('describeThrown', () => {
	it('describes an Error by name, message and stack', () => {
		const description = describeThrown(new TypeError('bad input'));
		expect(description).toMatchObject({ errorName: 'TypeError', errorMessage: 'bad input' });
		expect(description).toHaveProperty('stack');
	});

	it('describes a non-Error value by its type', () => {
		expect(describeThrown('text')).toEqual({ thrownValueType: 'string' });
		expect(describeThrown(null)).toEqual({ thrownValueType: 'null' });
	});
});
