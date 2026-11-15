import * as Sentry from '@sentry/nestjs';
import type { ErrorEvent } from '@sentry/nestjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initSentry, scrub, scrubTransaction, type TransactionEvent } from './sentry.js';

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

describe('traces', () => {
  const dsn = 'https://k@o1.ingest.sentry.io/2';
  it('fixent le taux de traces avec SENTRY_TRACES_SAMPLE_RATE', () => {
    initSentry({ SENTRY_DSN: dsn, NODE_ENV: 'production', SENTRY_TRACES_SAMPLE_RATE: 0.1 });
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ tracesSampleRate: 0.1, beforeSendTransaction: scrubTransaction }),
    );
  });
  it("retirent la requête de l'adresse et les données personnelles", () => {
    const event = {
      type: 'transaction',
      user: { id: '1' },
      request: { method: 'GET', url: 'https://api/x?token=abc#f', headers: { a: 'b' } },
      contexts: { trace: { data: { 'http.query': '?token=abc', 'http.status_code': 500 } } },
    } as unknown as TransactionEvent;
    const out = scrubTransaction(event);
    expect(out.request).toEqual({ method: 'GET', url: 'https://api/x' });
    expect(out.user).toBeUndefined();
    expect(out.contexts?.['trace']?.data).toEqual({ 'http.status_code': 500 });
  });
  it('accepte une trace sans requête', () => {
    expect(scrubTransaction({ type: 'transaction' } as TransactionEvent)).toEqual({
      type: 'transaction',
    });
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
