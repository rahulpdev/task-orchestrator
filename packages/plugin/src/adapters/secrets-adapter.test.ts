import { describe, expect, it } from 'vitest';
import { createObsidianSecretsAdapter } from './secrets-adapter.ts';

describe('createObsidianSecretsAdapter', () => {
	it('returns unavailable, reads null and writes nothing when secret storage is absent', async () => {
		const appWithoutStorage = {};
		const secrets = createObsidianSecretsAdapter(appWithoutStorage);
		expect(await secrets.set('licence-key', 'abc')).toEqual({ status: 'unavailable' });
		expect(await secrets.get('licence-key')).toBeNull();
		await secrets.delete('licence-key');
		expect(appWithoutStorage).toEqual({});
	});

	it('stores, reads and clears a secret through secret storage', async () => {
		const stored = new Map<string, string>();
		const secrets = createObsidianSecretsAdapter({
			secretStorage: {
				getSecret: (secretId) => stored.get(secretId) ?? null,
				setSecret: (secretId, secretValue) => {
					stored.set(secretId, secretValue);
				},
			},
		});
		expect(await secrets.set('licence-key', 'abc')).toEqual({ status: 'stored' });
		expect(await secrets.get('licence-key')).toBe('abc');
		await secrets.delete('licence-key');
		expect(await secrets.get('licence-key')).toBeNull();
	});
});
