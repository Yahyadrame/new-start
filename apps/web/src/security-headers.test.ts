import { describe, expect, it } from 'vitest';
import { securityHeaders } from '../security-headers.mjs';

const headers = Object.fromEntries(
  (securityHeaders()[0]?.headers ?? []).map((h) => [h.key, h.value]),
);

describe('securityHeaders', () => {
  it('s’applique à toutes les pages', () => {
    expect(securityHeaders().map((r) => r.source)).toEqual(['/:path*']);
  });

  it('interdit le sniffing de type et l’affichage dans un cadre', () => {
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
  });

  it('limite le referrer et force HTTPS', () => {
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
  });

  it('garde le micro pour le site et coupe la caméra et la position', () => {
    expect(headers['Permissions-Policy']).toBe('microphone=(self), camera=(), geolocation=()');
  });
});
