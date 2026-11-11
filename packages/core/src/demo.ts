/**
 * Temporary demonstration of structured logging; removed in Step 8 of the foundation plan.
 *
 * Run with `node packages/core/src/demo.ts`: prints three JSON lines.
 *
 * @packageDocumentation
 */
import { newCorrelationId } from './core/ids.ts';
import { createLogger, describeThrown } from './core/logging.ts';
import type { ClockPort, LogSink } from './core/ports.ts';

const consoleSink: LogSink = {
	write: (logEvent) => {
		console.debug(JSON.stringify(logEvent));
	},
};
const realClock: ClockPort = {
	now: () => new Date(),
	timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
};

const logger = createLogger(consoleSink, realClock);
const runLog = logger.withCorrelation(newCorrelationId());
const startedAt = realClock.now().getTime();
runLog.info('core.demo.run_started');
runLog.info('core.demo.run_completed', { durationMs: realClock.now().getTime() - startedAt });
logger.error('core.demo.step_failed', {
	errorCode: 'CORE_INTERNAL_ERROR',
	thrownError: describeThrown(new Error('demo')),
});
