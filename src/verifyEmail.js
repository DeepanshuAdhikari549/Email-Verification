'use strict';

const { validateEmailSyntax } = require('./validators');

const { getDidYouMean } = require('./didYouMean');

const dns = require('dns').promises;

async function verifyEmail(email) {

  const start = Date.now();

  if (!email) {

    return {
      email,
      result: 'invalid',
      resultcode: 6,
      subresult: 'empty_email',
      error: 'Email is required',
      timestamp: new Date().toISOString()
    };

  }

  const syntaxValid =
    validateEmailSyntax(email);

  if (!syntaxValid) {

    return {
      email,
      result: 'invalid',
      resultcode: 6,
      subresult: 'invalid_syntax',
      error: 'Invalid email syntax',
      timestamp: new Date().toISOString()
    };

  }

  const suggestion =
    getDidYouMean(email);

  if (suggestion) {

    return {
      email,
      result: 'invalid',
      resultcode: 6,
      subresult: 'typo_detected',
      didyoumean: suggestion,
      error: 'Possible typo detected',
      timestamp: new Date().toISOString()
    };

  }

  const domain = email.split('@')[1];

  try {

    const mxRecords =
      await dns.resolveMx(domain);

    return {
      email,
      result: 'valid',
      resultcode: 1,
      subresult: 'mailbox_exists',
      domain,
      mxRecords:
        mxRecords.map(mx => mx.exchange),
      executiontime:
        ((Date.now() - start) / 1000).toFixed(2),
      error: null,
      timestamp: new Date().toISOString()
    };

  } catch (error) {

    return {
      email,
      result: 'unknown',
      resultcode: 3,
      subresult: 'mx_lookup_failed',
      domain,
      mxRecords: [],
      executiontime:
        ((Date.now() - start) / 1000).toFixed(2),
      error: error.message,
      timestamp: new Date().toISOString()
    };

  }

}

module.exports = {
  verifyEmail
};
