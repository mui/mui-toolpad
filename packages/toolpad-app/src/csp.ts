import { randomBytes } from 'crypto';

export function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

export function getCsp(nonce: string): string {
  return [
    "connect-src 'self' data:",
    `script-src 'self' 'unsafe-eval' 'nonce-${nonce}'`,
    "style-src 'self' https://fonts.googleapis.com/ 'unsafe-inline'",
    'font-src https://fonts.gstatic.com/',
    "default-src 'self'",
  ].join(';');
}
