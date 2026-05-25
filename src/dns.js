'use strict';

const dns = require('dns').promises;

/**
 * Performs DNS MX lookup for a domain.
 * @param {string} domain
 * @returns {Promise<{ mxRecords: string[], error: string|null }>}
 */
async function lookupMxRecords(domain) {
  try {
    const records = await dns.resolveMx(domain);

    if (!records || records.length === 0) {
      return { mxRecords: [], error: 'No MX records found' };
    }

    const sorted = records
      .sort((a, b) => a.priority - b.priority)
      .map((record) => record.exchange.replace(/\.$/, ''));

    return { mxRecords: sorted, error: null };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return { mxRecords: [], error: 'No MX records found' };
    }
    return { mxRecords: [], error: err.message || 'DNS lookup failed' };
  }
}

module.exports = { lookupMxRecords };
