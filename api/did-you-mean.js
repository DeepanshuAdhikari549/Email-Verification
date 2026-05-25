'use strict';

const { getDidYouMean } = require('../src/didYouMean');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const email = req.query.email;

  if (!email) {
    return res.status(400).json({
      error: 'Missing email parameter',
      usage: '/api/did-you-mean?email=user@gmial.com',
    });
  }

  const suggestion = getDidYouMean(email);

  return res.status(200).json({
    email,
    didyoumean: suggestion,
    hasSuggestion: suggestion !== null,
    timestamp: new Date().toISOString(),
  });
};
