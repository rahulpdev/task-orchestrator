import { describe, expect, it } from 'vitest';
import { CORE_ERROR_CODES } from '../errors.ts';
import { LANGUAGES, messagesFor } from './index.ts';

describe('messagesFor', () => {
	it.each(LANGUAGES)('gives %s a notice for every shared error code', (language) => {
		const catalogue = messagesFor(language);
		for (const errorCode of Object.values(CORE_ERROR_CODES)) {
			expect(catalogue.errorNotices[errorCode]).toMatch(/\.$/);
		}
		expect(catalogue.errorNotices.SETTINGS_FILE_UNREADABLE).toMatch(/\.$/);
	});

	it('puts the error code into the fallback notice', () => {
		expect(messagesFor('en-GB').notices.operationFailed('CORE_X_Y')).toContain('CORE_X_Y');
	});

	it('reads an unknown error code as undefined', () => {
		expect(messagesFor('en-US').errorNotices.UNKNOWN_CODE_HERE).toBeUndefined();
	});

	it('gives both languages the same keys', () => {
		const britishKeys = Object.keys(messagesFor('en-GB').errorNotices).sort();
		expect(Object.keys(messagesFor('en-US').errorNotices).sort()).toEqual(britishKeys);
	});

	it('names the application, not the host, in the success notice', () => {
		expect(messagesFor('en-GB').notices.pingSucceeded).toBe(
			'Personal Task Orchestrator is working.',
		);
	});
});
