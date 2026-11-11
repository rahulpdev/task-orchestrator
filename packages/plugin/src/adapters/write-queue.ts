/**
 * Runs writes to one file strictly one after another, while writes to different files run in
 * parallel (TAD 2.4).
 *
 * @packageDocumentation
 */
import type { TFile } from 'obsidian';

/** Serialises work per file. */
export interface PerFileWriteQueue {
	/**
	 * Runs the work once every earlier job for the same file has finished.
	 *
	 * @param file - The file the work writes. Keyed by the file object, which survives renames.
	 * @param work - The job.
	 * @returns The job's result. A rejected job does not block later jobs.
	 */
	runExclusive<TResult>(file: TFile, work: () => Promise<TResult>): Promise<TResult>;
}

/**
 * Creates an empty per-file write queue.
 *
 * @returns The queue.
 */
export function createPerFileWriteQueue(): PerFileWriteQueue {
	const lastJobByFile = new WeakMap<TFile, Promise<unknown>>();
	return {
		runExclusive: (file, work) => {
			const previousJob = lastJobByFile.get(file) ?? Promise.resolve();
			const thisJob = previousJob.then(work);
			lastJobByFile.set(
				file,
				thisJob.catch(() => undefined),
			);
			return thisJob;
		},
	};
}
