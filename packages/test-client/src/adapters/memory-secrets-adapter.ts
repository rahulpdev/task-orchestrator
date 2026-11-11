/**
 * Secrets held in memory for the life of the process; nothing is written anywhere.
 *
 * @packageDocumentation
 */
import type { SecretsPort } from '@task-orchestrator/core';

/**
 * Creates a secrets adapter that keeps secrets in memory only.
 *
 * @returns The secrets adapter.
 */
export function createMemorySecretsAdapter(): SecretsPort {
	const storedSecrets = new Map<string, string>();
	return {
		get: (secretId) => Promise.resolve(storedSecrets.get(secretId) ?? null),
		set: (secretId, secretValue) => {
			storedSecrets.set(secretId, secretValue);
			return Promise.resolve({ status: 'stored' });
		},
		delete: (secretId) => {
			storedSecrets.delete(secretId);
			return Promise.resolve();
		},
	};
}
