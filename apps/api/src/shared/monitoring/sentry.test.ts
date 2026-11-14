import * as Sentry from '@sentry/nestjs';
import type { ErrorEvent } from '@sentry/nestjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initSentry, scrub } from './sentry.js';

vi.mock('@sentry/nestjs', () => ({ init: vi.fn() }));

afterEach(() => vi.clearAllMocks());

describe('initSentry', () => {
  it('ne fait rien sans DSN', () => {
    expect(initSentry({ SENTRY_DSN: undefined, NODE_ENV: 'production' })).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });
  it("s'active avec un DSN, sans traces", () => {
    const dsn = 'https://k@o1.ingest.sentry.io/2';
    expect(initSentry({ SENTRY_DSN: dsn, NODE_ENV: 'production' })).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn,
        tracesSampleRate: 0,
        beforeSend: scrub,
      }),
    );
  });
});

describe('scrub', () => {
  it("garde la méthode et l'URL, retire corps, cookies, en-têtes et utilisateur", () => {
    const event = {
      type: undefined,
      user: { id: '1', email: 'a@b.c' },
      request: {
        method: 'POST',
        url: '/x',
        data: 'message privé',
        cookies: { s: '1' },
        headers: { a: 'b' },
      },
    } as ErrorEvent;
    expect(scrub(event)).toEqual({ type: undefined, request: { method: 'POST', url: '/x' } });
  });
  it('accepte un événement sans requête', () => {
    expect(scrub({ type: undefined, user: { id: '1' } } as ErrorEvent)).toEqual({
      type: undefined,
    });
  });
});
