'use strict';

const net = require('net');
const { SMTP_TIMEOUT_MS } = require('./constants');

/**
 * Parses SMTP response code from a server line.
 * @param {string} line
 * @returns {number|null}
 */
function parseSmtpCode(line) {
  const match = line.match(/^(\d{3})/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Reads multi-line SMTP response until final line (code followed by space).
 * @param {import('net').Socket} socket
 * @returns {Promise<{ code: number, lines: string[] }>}
 */
function readSmtpResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = '';

    const onData = (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/).filter(Boolean);

      if (lines.length === 0) return;

      const lastLine = lines[lines.length - 1];
      const code = parseSmtpCode(lastLine);

      if (code !== null && /^\d{3} /.test(lastLine)) {
        cleanup();
        resolve({ code, lines });
      }
    };

    const onError = (err) => {
      cleanup();
      reject(err);
    };

    const onTimeout = () => {
      cleanup();
      reject(new Error('SMTP connection timeout'));
    };

    const cleanup = () => {
      socket.removeListener('data', onData);
      socket.removeListener('error', onError);
      socket.off('timeout', onTimeout);
    };

    socket.on('data', onData);
    socket.on('error', onError);
    socket.on('timeout', onTimeout);
  });
}

/**
 * Sends an SMTP command and waits for response.
 * @param {import('net').Socket} socket
 * @param {string} command
 * @returns {Promise<{ code: number, lines: string[] }>}
 */
async function sendCommand(socket, command) {
  socket.write(`${command}\r\n`);
  return readSmtpResponse(socket);
}

/**
 * Maps SMTP RCPT response to verification outcome.
 * @param {number} code
 * @returns {{ result: string, resultcode: number, subresult: string }}
 */
function mapSmtpResponse(code) {
  const { RESULT, RESULT_CODE, SUBRESULT } = require('./constants');

  if (code >= 200 && code < 300) {
    return {
      result: RESULT.VALID,
      resultcode: RESULT_CODE.VALID,
      subresult: SUBRESULT.MAILBOX_EXISTS,
    };
  }

  if (code === 450 || code === 451 || code === 452) {
    return {
      result: RESULT.UNKNOWN,
      resultcode: RESULT_CODE.UNKNOWN,
      subresult: SUBRESULT.GREYLISTED,
    };
  }

  if (code >= 500 && code < 600) {
    return {
      result: RESULT.INVALID,
      resultcode: RESULT_CODE.INVALID,
      subresult: SUBRESULT.MAILBOX_DOES_NOT_EXIST,
    };
  }

  return {
    result: RESULT.UNKNOWN,
    resultcode: RESULT_CODE.UNKNOWN,
    subresult: SUBRESULT.SMTP_ERROR,
  };
}

/**
 * Connects to SMTP server and checks mailbox via RCPT TO.
 * @param {string} mxHost
 * @param {string} email
 * @param {number} [timeoutMs]
 * @returns {Promise<{ result: string, resultcode: number, subresult: string, error: string|null, smtpCode?: number }>}
 */
function verifyMailboxSmtp(mxHost, email, timeoutMs = SMTP_TIMEOUT_MS) {
  const { RESULT, RESULT_CODE, SUBRESULT } = require('./constants');

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (outcome) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve(outcome);
    };

    const timer = setTimeout(() => {
      finish({
        result: RESULT.UNKNOWN,
        resultcode: RESULT_CODE.UNKNOWN,
        subresult: SUBRESULT.CONNECTION_TIMEOUT,
        error: 'SMTP connection timeout',
      });
    }, timeoutMs);

    socket.setTimeout(timeoutMs);

    socket.connect(25, mxHost, async () => {
      try {
        const greeting = await readSmtpResponse(socket);
        if (greeting.code !== 220) {
          clearTimeout(timer);
          return finish({
            result: RESULT.UNKNOWN,
            resultcode: RESULT_CODE.UNKNOWN,
            subresult: SUBRESULT.SMTP_ERROR,
            error: `Unexpected greeting: ${greeting.code}`,
            smtpCode: greeting.code,
          });
        }

        const ehloDomain = email.split('@')[1] || 'localhost';
        await sendCommand(socket, `EHLO ${ehloDomain}`);
        await sendCommand(socket, 'MAIL FROM:<>');
        const rcpt = await sendCommand(socket, `RCPT TO:<${email}>`);

        try {
          await sendCommand(socket, 'QUIT');
        } catch {
          /* ignore quit errors */
        }

        clearTimeout(timer);
        const mapped = mapSmtpResponse(rcpt.code);
        finish({ ...mapped, error: null, smtpCode: rcpt.code });
      } catch (err) {
        clearTimeout(timer);
        finish({
          result: RESULT.UNKNOWN,
          resultcode: RESULT_CODE.UNKNOWN,
          subresult: SUBRESULT.CONNECTION_ERROR,
          error: err.message || 'SMTP verification failed',
        });
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      finish({
        result: RESULT.UNKNOWN,
        resultcode: RESULT_CODE.UNKNOWN,
        subresult: SUBRESULT.CONNECTION_ERROR,
        error: err.message || 'Connection error',
      });
    });

    socket.on('timeout', () => {
      clearTimeout(timer);
      finish({
        result: RESULT.UNKNOWN,
        resultcode: RESULT_CODE.UNKNOWN,
        subresult: SUBRESULT.CONNECTION_TIMEOUT,
        error: 'SMTP socket timeout',
      });
    });
  });
}

module.exports = {
  verifyMailboxSmtp,
  mapSmtpResponse,
  parseSmtpCode,
  readSmtpResponse,
  sendCommand,
};
