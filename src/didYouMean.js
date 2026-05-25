'use strict';

const { levenshteinDistance } = require('./levenshtein');
const { POPULAR_DOMAINS } = require('./constants');
const { extractDomain, extractLocalPart } = require('./validators');

const MAX_EDIT_DISTANCE = 2;

const KNOWN_TYPOS = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outlookk.com': 'outlook.com',
};

/**
 * Suggests a corrected email for common domain typos.
 * @param {string} email
 * @returns {string|null}
 */
function getDidYouMean(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  const local = extractLocalPart(normalized);
  const domain = extractDomain(normalized);

  if (POPULAR_DOMAINS.includes(domain)) {
    return null;
  }

  if (KNOWN_TYPOS[domain]) {
    return `${local}@${KNOWN_TYPOS[domain]}`;
  }

  let bestMatch = null;
  let bestDistance = MAX_EDIT_DISTANCE + 1;

  for (const popularDomain of POPULAR_DOMAINS) {
    const distance = levenshteinDistance(domain, popularDomain);
    if (distance > 0 && distance <= MAX_EDIT_DISTANCE && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = popularDomain;
    }
  }

  if (bestMatch && bestMatch !== domain) {
    return `${local}@${bestMatch}`;
  }

  return null;
}

module.exports = { getDidYouMean, KNOWN_TYPOS, MAX_EDIT_DISTANCE };
