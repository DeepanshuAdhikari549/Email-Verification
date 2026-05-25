'use strict';

const express = require('express');

const { verifyEmail } = require('./verifyEmail');

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
