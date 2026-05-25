# Email Verification Module

A Node.js module that verifies email addresses using syntax validation, DNS MX lookup, and SMTP `RCPT TO` checks — with typo detection via Levenshtein distance.

## Features

- **Syntax validation** — RFC-style format checks (single `@`, no `..`, length limits)
- **DNS MX lookup** — Resolves mail servers for the domain
- **SMTP verification** — Connects to port 25 and issues `RCPT TO` to check mailbox existence
- **Typo detection** — Suggests corrections for common domain typos (`gmial.com` → `gmail.com`)
- **Structured results** — Consistent JSON output with result codes and subresults

## Installation

```bash
npm install
```

## Usage

```javascript
const { verifyEmail, getDidYouMean } = require('./src');

// Verify an email
const result = await verifyEmail('user@example.com');
console.log(result);

// Typo suggestion only
const suggestion = getDidYouMean('user@gmial.com');
// => "user@gmail.com"
```

### Example Output

```json
{
  "email": "user@example.com",
  "result": "valid",
  "resultcode": 1,
  "subresult": "mailbox_exists",
  "domain": "example.com",
  "mxRecords": ["mx1.example.com"],
  "executiontime": 1.24,
  "error": null,
  "timestamp": "2026-02-11T10:30:00.000Z"
}
```

### Result Codes

| Code | Result    | Meaning                          |
|------|-----------|----------------------------------|
| 1    | valid     | Mailbox likely exists            |
| 3    | unknown   | Greylisted, timeout, or ambiguous|
| 6    | invalid   | Syntax error, no MX, or rejected |

### Subresults

- `mailbox_exists` / `mailbox_does_not_exist`
- `greylisted` / `connection_timeout` / `connection_error`
- `syntax_error` / `typo_detected` / `no_mx_records`

## Run Tests

```bash
npm test
```

## Run Example

```bash
npm run verify
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import `DeepanshuAdhikari549/Email-Verification`
4. Click **Deploy** (no extra config needed)

### Live API Endpoints (after deploy)

| Endpoint | Description |
|----------|-------------|
| `GET /api/verify?email=user@example.com` | Full email verification |
| `GET /api/did-you-mean?email=user@gmial.com` | Typo suggestion only |
| `GET /api/health` | Health check |
| `/` | Web UI demo |

### Example API call

```bash
curl "https://your-app.vercel.app/api/verify?email=user@gmial.com"
```

## Project Structure

```
src/
  index.js          # Public exports
  verifyEmail.js    # Main verification orchestrator
  validators.js     # Syntax validation
  didYouMean.js     # Typo detection
  levenshtein.js    # Edit distance algorithm
  dns.js            # MX record lookup
  smtp.js           # SMTP RCPT TO verification
  constants.js      # Result codes and subresults
tests/
  verifyEmail.test.js
```

## Notes

- Live SMTP checks require outbound port 25 access; many ISPs block this.
- Major providers (Gmail, Outlook) often block or greylist verification attempts.
- Unit tests mock DNS and SMTP for reliable, offline execution.
