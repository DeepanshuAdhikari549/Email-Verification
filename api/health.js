'use strict';

module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Email Verification API',
    version: '1.0.0',
    endpoints: {
      verify: '/api/verify?email=user@example.com',
      didYouMean: '/api/did-you-mean?email=user@gmial.com',
      health: '/api/health',
    },
    timestamp: new Date().toISOString(),
  });
};
