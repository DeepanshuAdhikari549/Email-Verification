'use strict';

const { verifyEmail, getDidYouMean } = require('../src');

async function main() {
  const emails = [
    'user@gmail.com',
    'user@gmial.com',
    'invalid-email',
    'test@nonexistent-domain-xyz12345.invalid',
  ];

  for (const email of emails) {
    console.log('\n--- Verifying:', email, '---');
    const suggestion = getDidYouMean(email);
    if (suggestion) {
      console.log('Did you mean:', suggestion);
    }
    const result = await verifyEmail(email);
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);
