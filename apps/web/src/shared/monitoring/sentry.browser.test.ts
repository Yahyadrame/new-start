import * as Sentry from '@sentry/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { scrub } from './scrub';
import { initSentry } from './sentry.browser';

vi.mock('@sentry/browser', () => ({ init: vi.fn() }));

describe('initSentry', () => {
  beforeEach(() => vi.mocked(Sentry.init).mockClear());
  it('reste éteint sans DSN, vide ou absent', () => {
    expect(initSentry(undefined)).toBe(false);
    expect(initSentry('')).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });
  it("s'active avec un DSN, sans traces, avec le nettoyage", () => {
    expect(initSentry('https://k@o1.ingest.sentry.io/2')).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://k@o1.ingest.sentry.io/2',
        tracesSampleRate: 0,
        beforeSend: scrub,
      }),
    );
  });
});
