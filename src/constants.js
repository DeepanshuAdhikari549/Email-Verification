'use strict';

const RESULT = {
  VALID: 'valid',
  INVALID: 'invalid',
  UNKNOWN: 'unknown',
};

const RESULT_CODE = {
  VALID: 1,
  UNKNOWN: 3,
  INVALID: 6,
};

const SUBRESULT = {
  MAILBOX_EXISTS: 'mailbox_exists',
  MAILBOX_DOES_NOT_EXIST: 'mailbox_does_not_exist',
  GREYLISTED: 'greylisted',
  CONNECTION_ERROR: 'connection_error',
  CONNECTION_TIMEOUT: 'connection_timeout',
  SYNTAX_ERROR: 'syntax_error',
  NO_MX_RECORDS: 'no_mx_records',
  DNS_ERROR: 'dns_error',
  SMTP_ERROR: 'smtp_error',
  TYPO_DETECTED: 'typo_detected',
  EMPTY_INPUT: 'empty_input',
  INVALID_INPUT: 'invalid_input',
};

const SMTP_TIMEOUT_MS = 10000;

const POPULAR_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'live.com',
  'msn.com',
  'mail.com',
];

module.exports = {
  RESULT,
  RESULT_CODE,
  SUBRESULT,
  SMTP_TIMEOUT_MS,
  POPULAR_DOMAINS,
};
