/**
 * Secrets in Obsidian's secret storage (`app.secretStorage`, available since 1.11.4).
 *
 * When secret storage is absent, nothing is written anywhere: `get` returns `null` and `set`
 * returns `unavailable`. A secret is never stored as plain text in `data.json`.
 *
 * @packageDocumentation
 */
import type { SecretStorage } from 'obsidian';
import type { SecretsPort } from '@task-orchestrator/core';

/**
 * The part of the app this adapter reads. `secretStorage` is optional so the feature check is
 * real: an app without secret storage is handled, never assumed away.
 */
export interface SecretStorageHost {
	readonly secretStorage?: Pick<SecretStorage, 'getSecret' | 'setSecret'>;
}

/**
 * Creates a secrets adapter over the app's secret storage.
 *
 * Secret storage has no delete method, so `delete` stores an empty value, which `get` reads as
 * "not stored".
 *
 * @param storageView - The app instance, or any object with the same optional `secretStorage`.
 * @returns The secrets adapter.
 */
export function createObsidianSecretsAdapter(storageView: SecretStorageHost): SecretsPort {
	return {
		get: (secretId) => {
			const secretValue = storageView.secretStorage?.getSecret(secretId) ?? null;
			return Promise.resolve(secretValue === '' ? null : secretValue);
		},
		set: (secretId, secretValue) => {
			const secretStorage = storageView.secretStorage;
			if (secretStorage === undefined) {
				return Promise.resolve({ status: 'unavailable' });
			}
			secretStorage.setSecret(secretId, secretValue);
			return Promise.resolve({ status: 'stored' });
		},
		delete: (secretId) => {
			storageView.secretStorage?.setSecret(secretId, '');
			return Promise.resolve();
		},
	};
}
