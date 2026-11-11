import { TFile } from 'obsidian';
import { describe, expect, it } from 'vitest';
import { createPerFileWriteQueue } from './write-queue.ts';

function createGate(): { readonly opened: Promise<void>; readonly open: () => void } {
	let open: () => void = () => undefined;
	const opened = new Promise<void>((resolve) => {
		open = resolve;
	});
	return { opened, open };
}

describe('createPerFileWriteQueue', () => {
	it('runs two jobs on one file strictly one after the other', async () => {
		const queue = createPerFileWriteQueue();
		const file = new TFile();
		const events: string[] = [];
		const gate = createGate();
		const first = queue.runExclusive(file, async () => {
			events.push('first started');
			await gate.opened;
			events.push('first finished');
		});
		const second = queue.runExclusive(file, () => {
			events.push('second started');
			return Promise.resolve();
		});
		await Promise.resolve();
		expect(events).toEqual(['first started']);
		gate.open();
		await Promise.all([first, second]);
		expect(events).toEqual(['first started', 'first finished', 'second started']);
	});

	it('runs jobs on two files in parallel', async () => {
		const queue = createPerFileWriteQueue();
		const gate = createGate();
		const events: string[] = [];
		const slow = queue.runExclusive(new TFile(), async () => {
			await gate.opened;
			events.push('slow finished');
		});
		await queue.runExclusive(new TFile(), () => {
			events.push('fast finished');
			return Promise.resolve();
		});
		expect(events).toEqual(['fast finished']);
		gate.open();
		await slow;
	});

	it('does not let a rejected job block the next one', async () => {
		const queue = createPerFileWriteQueue();
		const file = new TFile();
		await expect(
			queue.runExclusive(file, () => Promise.reject(new Error('failed'))),
		).rejects.toThrow('failed');
		await expect(queue.runExclusive(file, () => Promise.resolve('next'))).resolves.toBe('next');
	});
});
