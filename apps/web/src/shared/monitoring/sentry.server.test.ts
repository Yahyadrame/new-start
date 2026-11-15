import * as Sentry from '@sentry/node';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { scrub } from './scrub';
import { captureServerError, initSentryServer } from './sentry.server';

vi.mock('@sentry/node', () => ({ init: vi.fn(), captureException: vi.fn() }));

describe('initSentryServer', () => {
  beforeEach(() => vi.mocked(Sentry.init).mockClear());
  it('reste éteint sans DSN', () => {
    expect(initSentryServer(undefined)).toBe(false);
    expect(initSentryServer('')).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });
  it("s'active avec un DSN, sans traces, avec le nettoyage", () => {
    expect(initSentryServer('https://k@o1.ingest.sentry.io/2')).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ tracesSampleRate: 0, beforeSend: scrub }),
    );
  });
});

describe('captureServerError', () => {
  it("transmet l'erreur à Sentry", () => {
    const err = new Error('boum');
    captureServerError(err);
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });
});
