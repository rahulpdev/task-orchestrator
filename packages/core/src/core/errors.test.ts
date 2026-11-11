import { describe, expect, it } from 'vitest';
import { CORE_ERROR_CODES, createAppError, isValidErrorCode } from './errors.ts';

describe('CORE_ERROR_CODES', () => {
	it.each(Object.values(CORE_ERROR_CODES))('%s is a valid error code', (errorCode) => {
		expect(isValidErrorCode(errorCode)).toBe(true);
	});

	it('lists exactly the five shared codes', () => {
		expect(Object.values(CORE_ERROR_CODES).sort()).toEqual([
			'CORE_CONFIRMATION_REQUIRED',
			'CORE_INPUT_INVALID',
			'CORE_INTERNAL_ERROR',
			'CORE_STORE_UNAVAILABLE',
			'CORE_TARGET_NOT_FOUND',
		]);
	});
});

describe('isValidErrorCode', () => {
	it.each([
		'CORE_INPUT_INVALID',
		'EXPORT_IMPORT_ARCHIVE_INVALID',
		'SETTINGS_FILE_UNREADABLE',
		'ORGANISE_BLOCKER_LOOP',
		'PAID_SERVICE_TRIAL_EXPIRED',
	])('accepts %s', (errorCode) => {
		expect(isValidErrorCode(errorCode)).toBe(true);
	});

	it.each([
		'CORE_INVALID',
		'UNKNOWN_DOMAIN_PROBLEM',
		'core_input_invalid',
		'CORE_INPUT_',
		'CORE__INVALID',
		'',
	])('rejects %j', (errorCode) => {
		expect(isValidErrorCode(errorCode)).toBe(false);
	});
});

describe('createAppError', () => {
	it('leaves the details key out when no details are given', () => {
		const appError = createAppError('CORE_INTERNAL_ERROR', 'Boom.', false);
		expect(appError).toEqual({
			errorCode: 'CORE_INTERNAL_ERROR',
			message: 'Boom.',
			retryable: false,
		});
		expect('details' in appError).toBe(false);
	});

	it('keeps details when given', () => {
		const appError = createAppError('CORE_INPUT_INVALID', 'Bad.', false, {
			issuePaths: ['name'],
		});
		expect(appError.details).toEqual({ issuePaths: ['name'] });
	});
});
