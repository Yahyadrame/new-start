import { describe, expect, it } from 'vitest';
import { originMatchers } from './cors.js';

const allowed = (list: string[], origin: string) =>
  originMatchers(list).some((m) => (typeof m === 'string' ? m === origin : m.test(origin)));

describe('originMatchers', () => {
  it('garde une origine exacte telle quelle', () => {
    expect(originMatchers(['https://a.vercel.app'])).toEqual(['https://a.vercel.app']);
  });
  it("accepte les aperçus d'un projet Vercel", () => {
    const list = ['https://new-start-*-yhd.vercel.app'];
    expect(allowed(list, 'https://new-start-l6wl2cdgx-yhd.vercel.app')).toBe(true);
    expect(allowed(list, 'https://new-start-git-feat-ns-011-yhd.vercel.app')).toBe(true);
  });
  it('refuse un autre domaine, un point dans le joker et un http', () => {
    const list = ['https://new-start-*-yhd.vercel.app'];
    expect(allowed(list, 'https://new-start-x-yhd.vercel.app.evil.test')).toBe(false);
    expect(allowed(list, 'https://new-start-a.evil.test/-yhd.vercel.app')).toBe(false);
    expect(allowed(list, 'https://new-start-a.b-yhd.vercel.app')).toBe(false);
    expect(allowed(list, 'http://new-start-x-yhd.vercel.app')).toBe(false);
  });
  it('traite les points comme des points', () => {
    expect(allowed(['https://*.vercel.app'], 'https://axvercel.app')).toBe(false);
  });
});
