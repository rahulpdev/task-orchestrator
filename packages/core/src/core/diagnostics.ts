/**
 * Diagnostic operations that prove the wiring from a host to the core works.
 *
 * @packageDocumentation
 */
import * as z from 'zod';
import { defineOperation } from './api.ts';

/** Reads and writes nothing; returns the clock's current time. */
export const pingOperation = defineOperation({
	name: 'ping',
	version: 1,
	kind: 'operation',
	request: z.object({}),
	outcome: z.object({ respondedAt: z.string() }),
	handler: (_payload, context) =>
		Promise.resolve({
			ok: true,
			outcome: { respondedAt: context.adapters.clock.now().toISOString() },
		}),
});
