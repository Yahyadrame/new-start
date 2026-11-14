import * as Sentry from '@sentry/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initSentry, scrub } from './sentry';

vi.mock('@sentry/browser', () => ({ init: vi.fn() }));

const event = (extra: object = {}) => ({ type: undefined, ...extra }) as Sentry.ErrorEvent;

describe('scrub', () => {
  it("garde l'adresse de la page sans requête ni ancre", () => {
    const out = scrub(
      event({ request: { url: 'https://x.app/reset?token=abc#frag', headers: { a: 'b' } } }),
    );
    expect(out.request).toEqual({ url: 'https://x.app/reset' });
  });
  it("retire l'utilisateur, les breadcrumbs et une requête sans adresse", () => {
    const out = scrub(
      event({
        user: { id: '1' },
        breadcrumbs: [{ message: 'salut' }],
        request: { headers: { a: 'b' } },
      }),
    );
    expect(out).toEqual({ type: undefined });
  });
});

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
