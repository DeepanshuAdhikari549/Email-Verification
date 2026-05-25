'use strict';

const { verifyEmail } = require('../src/verifyEmail');
const { getDidYouMean } = require('../src/didYouMean');
const { validateEmailSyntax } = require('../src/validators');
const { levenshteinDistance } = require('../src/levenshtein');
const { mapSmtpResponse } = jest.requireActual('../src/smtp');
const { RESULT, RESULT_CODE, SUBRESULT } = require('../src/constants');

jest.mock('../src/dns');
jest.mock('../src/smtp');

const dns = require('../src/dns');
const smtp = require('../src/smtp');

describe('validateEmailSyntax', () => {
  test('accepts valid email formats', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.co.uk',
      'user+tag@domain.org',
      'a@b.co',
    ];

    for (const email of validEmails) {
      expect(validateEmailSyntax(email).valid).toBe(true);
    }
  });

  test('rejects missing @ symbol', () => {
    const result = validateEmailSyntax('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/@/);
  });

  test('rejects double dots in local part', () => {
    const result = validateEmailSyntax('user..name@example.com');
    expect(result.valid).toBe(false);
  });

  test('rejects multiple @ symbols', () => {
    const result = validateEmailSyntax('user@@example.com');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/exactly one/);
  });

  test('rejects email without domain', () => {
    const result = validateEmailSyntax('user@');
    expect(result.valid).toBe(false);
  });
});

describe('getDidYouMean', () => {
  test('suggests gmail.com for gmial.com typo', () => {
    expect(getDidYouMean('user@gmial.com')).toBe('user@gmail.com');
  });

  test('suggests yahoo.com for yahooo.com typo', () => {
    expect(getDidYouMean('user@yahooo.com')).toBe('user@yahoo.com');
  });

  test('suggests hotmail.com for hotmial.com typo', () => {
    expect(getDidYouMean('user@hotmial.com')).toBe('user@hotmail.com');
  });

  test('suggests outlook.com for outlok.com typo', () => {
    expect(getDidYouMean('user@outlok.com')).toBe('user@outlook.com');
  });

  test('returns null for correct domains', () => {
    expect(getDidYouMean('user@gmail.com')).toBeNull();
  });

  test('returns null for invalid input', () => {
    expect(getDidYouMean(null)).toBeNull();
    expect(getDidYouMean('')).toBeNull();
    expect(getDidYouMean('not-an-email')).toBeNull();
  });
});

describe('levenshteinDistance', () => {
  test('returns 0 for identical strings', () => {
    expect(levenshteinDistance('gmail.com', 'gmail.com')).toBe(0);
  });

  test('returns 1 for single character insertion', () => {
    expect(levenshteinDistance('gmal.com', 'gmail.com')).toBe(1);
  });

  test('returns distance greater than 2 for very different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBeGreaterThan(2);
  });
});

describe('mapSmtpResponse', () => {
  test('maps 250 response to valid mailbox_exists', () => {
    const mapped = mapSmtpResponse(250);
    expect(mapped.result).toBe(RESULT.VALID);
    expect(mapped.resultcode).toBe(RESULT_CODE.VALID);
    expect(mapped.subresult).toBe(SUBRESULT.MAILBOX_EXISTS);
  });

  test('maps 550 response to invalid mailbox_does_not_exist', () => {
    const mapped = mapSmtpResponse(550);
    expect(mapped.result).toBe(RESULT.INVALID);
    expect(mapped.resultcode).toBe(RESULT_CODE.INVALID);
    expect(mapped.subresult).toBe(SUBRESULT.MAILBOX_DOES_NOT_EXIST);
  });

  test('maps 450 response to unknown greylisted', () => {
    const mapped = mapSmtpResponse(450);
    expect(mapped.result).toBe(RESULT.UNKNOWN);
    expect(mapped.resultcode).toBe(RESULT_CODE.UNKNOWN);
    expect(mapped.subresult).toBe(SUBRESULT.GREYLISTED);
  });
});

describe('verifyEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dns.lookupMxRecords.mockResolvedValue({
      mxRecords: ['mx.example.com'],
      error: null,
    });
  });

  test('returns invalid for empty string', async () => {
    const result = await verifyEmail('');
    expect(result.result).toBe(RESULT.INVALID);
    expect(result.resultcode).toBe(RESULT_CODE.INVALID);
    expect(result.subresult).toBe(SUBRESULT.EMPTY_INPUT);
    expect(result.error).toBeTruthy();
  });

  test('returns invalid for null input', async () => {
    const result = await verifyEmail(null);
    expect(result.result).toBe(RESULT.INVALID);
    expect(result.subresult).toBe(SUBRESULT.EMPTY_INPUT);
  });

  test('returns invalid for undefined input', async () => {
    const result = await verifyEmail(undefined);
    expect(result.result).toBe(RESULT.INVALID);
    expect(result.subresult).toBe(SUBRESULT.EMPTY_INPUT);
  });

  test('returns invalid for syntax errors', async () => {
    const result = await verifyEmail('not-valid');
    expect(result.result).toBe(RESULT.INVALID);
    expect(result.subresult).toBe(SUBRESULT.SYNTAX_ERROR);
    expect(result.resultcode).toBe(RESULT_CODE.INVALID);
  });

  test('returns invalid with typo_detected for gmial.com', async () => {
    const result = await verifyEmail('user@gmial.com');
    expect(result.result).toBe(RESULT.INVALID);
    expect(result.subresult).toBe(SUBRESULT.TYPO_DETECTED);
    expect(result.didyoumean).toBe('user@gmail.com');
    expect(dns.lookupMxRecords).not.toHaveBeenCalled();
  });

  test('rejects very long email addresses', async () => {
    const longLocal = 'a'.repeat(250);
    const result = await verifyEmail(`${longLocal}@example.com`);
    expect(result.result).toBe(RESULT.INVALID);
    expect(result.subresult).toBe(SUBRESULT.SYNTAX_ERROR);
  });

  test('rejects multiple @ symbols', async () => {
    const result = await verifyEmail('user@domain@example.com');
    expect(result.result).toBe(RESULT.INVALID);
    expect(result.subresult).toBe(SUBRESULT.SYNTAX_ERROR);
  });

  test('returns invalid when no MX records found', async () => {
    dns.lookupMxRecords.mockResolvedValue({
      mxRecords: [],
      error: 'No MX records found',
    });

    const result = await verifyEmail('user@nodomain.test');
    expect(result.result).toBe(RESULT.INVALID);
    expect(result.subresult).toBe(SUBRESULT.NO_MX_RECORDS);
    expect(result.mxRecords).toEqual([]);
  });

  test('returns valid when SMTP responds 250', async () => {
    smtp.verifyMailboxSmtp.mockResolvedValue({
      result: RESULT.VALID,
      resultcode: RESULT_CODE.VALID,
      subresult: SUBRESULT.MAILBOX_EXISTS,
      error: null,
      smtpCode: 250,
    });

    const result = await verifyEmail('user@example.com');
    expect(result.result).toBe(RESULT.VALID);
    expect(result.resultcode).toBe(RESULT_CODE.VALID);
    expect(result.subresult).toBe(SUBRESULT.MAILBOX_EXISTS);
    expect(result.domain).toBe('example.com');
    expect(result.mxRecords).toEqual(['mx.example.com']);
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(typeof result.executiontime).toBe('number');
  });

  test('returns invalid when SMTP responds 550', async () => {
    smtp.verifyMailboxSmtp.mockResolvedValue({
      result: RESULT.INVALID,
      resultcode: RESULT_CODE.INVALID,
      subresult: SUBRESULT.MAILBOX_DOES_NOT_EXIST,
      error: null,
      smtpCode: 550,
    });

    const result = await verifyEmail('missing@example.com');
    expect(result.result).toBe(RESULT.INVALID);
    expect(result.resultcode).toBe(RESULT_CODE.INVALID);
    expect(result.subresult).toBe(SUBRESULT.MAILBOX_DOES_NOT_EXIST);
  });

  test('returns unknown when SMTP responds 450 greylisted', async () => {
    smtp.verifyMailboxSmtp.mockResolvedValue({
      result: RESULT.UNKNOWN,
      resultcode: RESULT_CODE.UNKNOWN,
      subresult: SUBRESULT.GREYLISTED,
      error: null,
      smtpCode: 450,
    });

    const result = await verifyEmail('user@example.com');
    expect(result.result).toBe(RESULT.UNKNOWN);
    expect(result.resultcode).toBe(RESULT_CODE.UNKNOWN);
    expect(result.subresult).toBe(SUBRESULT.GREYLISTED);
  });

  test('returns unknown on connection timeout', async () => {
    smtp.verifyMailboxSmtp.mockResolvedValue({
      result: RESULT.UNKNOWN,
      resultcode: RESULT_CODE.UNKNOWN,
      subresult: SUBRESULT.CONNECTION_TIMEOUT,
      error: 'SMTP connection timeout',
    });

    const result = await verifyEmail('user@example.com');
    expect(result.result).toBe(RESULT.UNKNOWN);
    expect(result.resultcode).toBe(RESULT_CODE.UNKNOWN);
    expect(result.subresult).toBe(SUBRESULT.CONNECTION_TIMEOUT);
    expect(result.error).toMatch(/timeout/i);
  });

  test('returns unknown on connection error', async () => {
    smtp.verifyMailboxSmtp.mockResolvedValue({
      result: RESULT.UNKNOWN,
      resultcode: RESULT_CODE.UNKNOWN,
      subresult: SUBRESULT.CONNECTION_ERROR,
      error: 'Connection refused',
    });

    const result = await verifyEmail('user@example.com');
    expect(result.result).toBe(RESULT.UNKNOWN);
    expect(result.subresult).toBe(SUBRESULT.CONNECTION_ERROR);
  });

  test('includes all required output fields', async () => {
    smtp.verifyMailboxSmtp.mockResolvedValue({
      result: RESULT.VALID,
      resultcode: RESULT_CODE.VALID,
      subresult: SUBRESULT.MAILBOX_EXISTS,
      error: null,
    });

    const result = await verifyEmail('user@example.com');

    expect(result).toMatchObject({
      email: 'user@example.com',
      result: expect.any(String),
      resultcode: expect.any(Number),
      subresult: expect.any(String),
      domain: 'example.com',
      mxRecords: expect.any(Array),
      executiontime: expect.any(Number),
      timestamp: expect.any(String),
    });
    expect(result.error === null || typeof result.error === 'string').toBe(true);
  });
});
