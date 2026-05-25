'use strict';

const { verifyEmail } = require('./verifyEmail');
const { getDidYouMean } = require('./didYouMean');
const { levenshteinDistance } = require('./levenshtein');
const { validateEmailSyntax } = require('./validators');
const { lookupMxRecords } = require('./dns');
const { verifyMailboxSmtp, mapSmtpResponse } = require('./smtp');
const constants = require('./constants');

module.exports = {
  verifyEmail,
  getDidYouMean,
  levenshteinDistance,
  validateEmailSyntax,
  lookupMxRecords,
  verifyMailboxSmtp,
  mapSmtpResponse,
  ...constants,
};
