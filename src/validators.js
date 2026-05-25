'use strict';

const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_LENGTH = 64;

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates email syntax and format rules.
 * @param {string} email
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateEmailSyntax(email) {
  if (email == null || typeof email !== 'string') {
    return { valid: false, reason: 'Email must be a non-empty string' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'Email cannot be empty' };
  }

  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return { valid: false, reason: `Email exceeds maximum length of ${MAX_EMAIL_LENGTH}` };
  }

  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { valid: false, reason: 'Email must contain exactly one @ symbol' };
  }

  const [local, domain] = trimmed.split('@');

  if (!local || !domain) {
    return { valid: false, reason: 'Invalid email structure' };
  }

  if (local.length > MAX_LOCAL_LENGTH) {
    return { valid: false, reason: `Local part exceeds maximum length of ${MAX_LOCAL_LENGTH}` };
  }

  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return { valid: false, reason: 'Invalid local part format' };
  }

  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return { valid: false, reason: 'Invalid domain format' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, reason: 'Email format is invalid' };
  }

  return { valid: true, normalized: trimmed.toLowerCase() };
}

/**
 * Extracts domain from a valid email string.
 * @param {string} email
 * @returns {string}
 */
function extractDomain(email) {
  return email.split('@')[1].toLowerCase();
}

/**
 * Extracts local part from email.
 * @param {string} email
 * @returns {string}
 */
function extractLocalPart(email) {
  return email.split('@')[0];
}

module.exports = {
  validateEmailSyntax,
  extractDomain,
  extractLocalPart,
  MAX_EMAIL_LENGTH,
};
