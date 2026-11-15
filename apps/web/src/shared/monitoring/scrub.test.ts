import type { ErrorEvent } from '@sentry/node';
import { describe, expect, it } from 'vitest';
import { scrub } from './scrub';

const event = (extra: object = {}) => ({ type: undefined, ...extra }) as ErrorEvent;

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
