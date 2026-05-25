'use strict';

const { RESULT, RESULT_CODE, SUBRESULT } = require('./constants');
const { validateEmailSyntax, extractDomain } = require('./validators');
const { getDidYouMean } = require('./didYouMean');
const { lookupMxRecords } = require('./dns');
const { verifyMailboxSmtp } = require('./smtp');

/**
 * Builds a standardized verification result object.
 */
function buildResult({
  email,
  result,
  resultcode,
  subresult,
  domain = '',
  mxRecords = [],
  executiontime = 0,
  error = null,
  didyoumean = null,
}) {
  const output = {
    email: email ?? '',
    result,
    resultcode,
    subresult,
    domain,
    mxRecords,
    executiontime,
    error,
    timestamp: new Date().toISOString(),
  };

  if (didyoumean) {
    output.didyoumean = didyoumean;
  }

  return output;
}

/**
 * Verifies an email address via syntax check, DNS MX lookup, and SMTP RCPT TO.
 * @param {string} email
 * @param {object} [options]
 * @param {boolean} [options.skipSmtp=false] - Skip live SMTP check (syntax/DNS only)
 * @returns {Promise<object>}
 */
async function verifyEmail(email, options = {}) {
  const start = Date.now();
  const input = email == null ? '' : String(email);

  const syntax = validateEmailSyntax(input);
  if (!syntax.valid) {
    const subresult =
      input.trim().length === 0 ? SUBRESULT.EMPTY_INPUT : SUBRESULT.SYNTAX_ERROR;

    return buildResult({
      email: input,
      result: RESULT.INVALID,
      resultcode: RESULT_CODE.INVALID,
      subresult,
      executiontime: (Date.now() - start) / 1000,
      error: syntax.reason,
    });
  }

  const normalizedEmail = syntax.normalized;
  const domain = extractDomain(normalizedEmail);
  const suggestion = getDidYouMean(normalizedEmail);

  if (suggestion) {
    return buildResult({
      email: normalizedEmail,
      result: RESULT.INVALID,
      resultcode: RESULT_CODE.INVALID,
      subresult: SUBRESULT.TYPO_DETECTED,
      domain,
      mxRecords: [],
      executiontime: (Date.now() - start) / 1000,
      error: 'Domain typo detected',
      didyoumean: suggestion,
    });
  }

  const { mxRecords, error: dnsError } = await lookupMxRecords(domain);

  if (mxRecords.length === 0) {
    const noMxSubresult =
      dnsError && dnsError !== 'No MX records found'
        ? SUBRESULT.DNS_ERROR
        : SUBRESULT.NO_MX_RECORDS;

    return buildResult({
      email: normalizedEmail,
      result: RESULT.INVALID,
      resultcode: RESULT_CODE.INVALID,
      subresult: noMxSubresult,
      domain,
      mxRecords: [],
      executiontime: (Date.now() - start) / 1000,
      error: dnsError || 'No MX records found for domain',
    });
  }

  if (options.skipSmtp) {
    return buildResult({
      email: normalizedEmail,
      result: RESULT.UNKNOWN,
      resultcode: RESULT_CODE.UNKNOWN,
      subresult: SUBRESULT.SMTP_ERROR,
      domain,
      mxRecords,
      executiontime: (Date.now() - start) / 1000,
      error: null,
    });
  }

  let smtpOutcome = null;

  for (const mxHost of mxRecords) {
    smtpOutcome = await verifyMailboxSmtp(mxHost, normalizedEmail);

    if (smtpOutcome.result === RESULT.VALID) {
      break;
    }

    if (smtpOutcome.result === RESULT.INVALID) {
      break;
    }
  }

  return buildResult({
    email: normalizedEmail,
    result: smtpOutcome.result,
    resultcode: smtpOutcome.resultcode,
    subresult: smtpOutcome.subresult,
    domain,
    mxRecords,
    executiontime: (Date.now() - start) / 1000,
    error: smtpOutcome.error,
  });
}

module.exports = { verifyEmail, buildResult };
