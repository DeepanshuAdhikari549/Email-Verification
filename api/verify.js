'use strict';

const { verifyEmail } = require('../src/verifyEmail');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  let email;
  if (req.method === 'GET') {
    email = req.query.email;
  } else {
    const body =
      typeof req.body === 'string'
        ? req.body
          ? JSON.parse(req.body)
          : {}
        : req.body || {};
    email = body.email;
  }

  if (!email) {
    return res.status(400).json({
      error: 'Missing email parameter',
      usage: {
        GET: '/api/verify?email=user@example.com',
        POST: '{ "email": "user@example.com" }',
      },
    });
  }

  try {
    const result = await verifyEmail(email);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Verification failed',
      timestamp: new Date().toISOString(),
    });
  }
};
