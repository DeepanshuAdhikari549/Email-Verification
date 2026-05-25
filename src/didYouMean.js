'use strict';

const domains = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com'
];

const {
  levenshteinDistance
} = require('./levenshtein');

function getDidYouMean(email) {

  const parts = email.split('@');

  if (parts.length !== 2) {
    return null;
  }

  const username = parts[0];

  const domain = parts[1];

  for (const correctDomain of domains) {

    const distance =
      levenshteinDistance(
        domain,
        correctDomain
      );

    if (distance <= 2 &&
        domain !== correctDomain) {

      return `${username}@${correctDomain}`;

    }

  }

  return null;

}

module.exports = {
  getDidYouMean
};
