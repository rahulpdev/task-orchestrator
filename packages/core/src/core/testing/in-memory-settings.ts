/**
 * A settings file held in memory, for core tests.
 *
 * @packageDocumentation
 */
import type { SettingsPort } from '../ports.ts';

/** The in-memory settings plus direct access to the saved value, for assertions. */
export interface InMemorySettings extends SettingsPort {
	/** The value last saved, or the starting value; `null` when nothing has been saved. */
	savedValue: unknown;
}

/**
 * Creates a settings file held in memory.
 *
 * @param initialValue - The value the file starts with; `null` means nothing has been saved.
 * @returns A settings adapter whose saves change only the in-memory value.
 */
export function createInMemorySettings(initialValue: unknown = null): InMemorySettings {
	const inMemorySettings: InMemorySettings = {
		savedValue: initialValue,
		load: () => Promise.resolve(inMemorySettings.savedValue),
		save: (settings) => {
			inMemorySettings.savedValue = settings;
			return Promise.resolve();
		},
	};
	return inMemorySettings;
}
