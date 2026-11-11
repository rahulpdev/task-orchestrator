import type { Command } from 'obsidian';
import { describe, expect, it, vi } from 'vitest';
import { registerCommands } from './commands.ts';
import { createFakeCore } from './test-helpers/fake-core.ts';
import type { FakeCore } from './test-helpers/fake-core.ts';

function registerPing(fake: FakeCore): Command {
	const registered: Command[] = [];
	registerCommands(
		{
			addCommand: (command) => {
				registered.push(command);
				return command;
			},
		},
		fake.core,
		() => fake.core.messagesFor('en-GB'),
		fake.adapters.notifier,
	);
	const [pingCommand] = registered;
	if (pingCommand === undefined) {
		throw new Error('No command was registered.');
	}
	return pingCommand;
}

describe('the ping command', () => {
	it('is registered with a plain id, catalogue name and no hotkeys', () => {
		const pingCommand = registerPing(createFakeCore());
		expect(pingCommand).toMatchObject({
			id: 'ping',
			name: 'Check that the application core responds',
		});
		expect(pingCommand.hotkeys).toBeUndefined();
	});

	it('runs ping version 1 as the user and shows the success notice', async () => {
		const fake = createFakeCore();
		registerPing(fake).callback?.();
		await vi.waitFor(() => {
			expect(fake.notices).toEqual(['Personal Task Orchestrator is working.']);
		});
		expect(fake.logLines[0]).toMatchObject({
			operationName: 'ping',
			operationVersion: 1,
			actor: 'user',
		});
	});

	it("shows the code's notice when the result is a failure", async () => {
		const fake = createFakeCore();
		const failingFake: FakeCore = {
			...fake,
			core: {
				...fake.core,
				execute: () =>
					Promise.resolve({
						ok: false as const,
						correlationId: 'test-id',
						error: {
							errorCode: 'CORE_TARGET_NOT_FOUND',
							message: 'Missing.',
							retryable: false,
						},
					}),
			},
		};
		registerPing(failingFake).callback?.();
		await vi.waitFor(() => {
			expect(fake.notices).toEqual([
				fake.core.messagesFor('en-GB').errorNotices.CORE_TARGET_NOT_FOUND,
			]);
		});
	});

	it('shows operationFailed and does not throw when execute rejects', async () => {
		const fake = createFakeCore();
		const rejectingFake: FakeCore = {
			...fake,
			core: { ...fake.core, execute: () => Promise.reject(new Error('boom')) },
		};
		const pingCommand = registerPing(rejectingFake);
		expect(() => {
			pingCommand.callback?.();
		}).not.toThrow();
		await vi.waitFor(() => {
			expect(fake.notices).toEqual([
				fake.core.messagesFor('en-GB').notices.operationFailed('CORE_INTERNAL_ERROR'),
			]);
		});
		expect(fake.logLines.some((line) => line.event === 'plugin.command.ping_failed')).toBe(
			true,
		);
	});
});
