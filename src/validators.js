'use strict';

function validateEmailSyntax(email) {

  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(email);

}

module.exports = {
  validateEmailSyntax
};
