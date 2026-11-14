import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { REDACT_PATHS } from './redact.js';

function logRequest(headers: Record<string, string>): string {
  let out = '';
  const stream = new Writable({
    write(chunk, _enc, done) {
      out += String(chunk);
      done();
    },
  });
  pino({ redact: REDACT_PATHS }, stream).info({ req: { headers } }, 'request completed');
  return out;
}

describe('REDACT_PATHS', () => {
  it.each(['authorization', 'cookie', 'x-sentry-test-token'])('masque l’en-tête %s', (name) => {
    const out = logRequest({ [name]: 'valeur-secrete', host: 'api.test' });
    expect(out).not.toContain('valeur-secrete');
    expect(out).toContain('[Redacted]');
    expect(out).toContain('api.test');
  });

  it('masque set-cookie dans la réponse', () => {
    let out = '';
    const stream = new Writable({
      write(chunk, _enc, done) {
        out += String(chunk);
        done();
      },
    });
    pino({ redact: REDACT_PATHS }, stream).info({
      res: { headers: { 'set-cookie': 'sid=secret' } },
    });
    expect(out).not.toContain('sid=secret');
  });
});
