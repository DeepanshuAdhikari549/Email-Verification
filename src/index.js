'use strict';

const express = require('express');

const { verifyEmail } = require('./verifyEmail');
const { getDidYouMean } = require('./didYouMean');
const { levenshteinDistance } = require('./levenshtein');
const { validateEmailSyntax } = require('./validators');
const { lookupMxRecords } = require('./dns');
const { verifyMailboxSmtp, mapSmtpResponse } = require('./smtp');
const constants = require('./constants');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Email Verification API Running');
});

app.post('/verify-email', async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        result: 'invalid',
        error: 'Email is required'
      });
    }

    const result = await verifyEmail(email);

    res.json(result);

  } catch (error) {

    res.status(500).json({
      result: 'unknown',
      error: error.message
    });

  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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
