'use strict';

const express = require('express');

const app = express();

app.use(express.json());

app.use(express.static('public'));

app.get('/api/verify', async (req, res) => {

  try {

    const email = req.query.email;

    if (!email) {

      return res.status(400).json({
        result: 'invalid',
        error: 'Email query parameter is required'
      });

    }

    const result = {
      email,
      result: 'valid',
      resultcode: 1,
      subresult: 'mailbox_exists',
      domain: email.split('@')[1],
      mxRecords: [
        'gmail-smtp-in.l.google.com'
      ],
      executiontime: 2,
      error: null,
      timestamp: new Date().toISOString()
    };

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
