import type { NestExpressApplication } from '@nestjs/platform-express';
import { describe, expect, it, vi } from 'vitest';
import { API_SECURITY_HEADERS, securityHeaders, useSecurityHeaders } from './security-headers.js';

describe('securityHeaders', () => {
  it('pose chaque en-tête puis passe au suivant', () => {
    const setHeader = vi.fn();
    const next = vi.fn();
    securityHeaders({}, { setHeader }, next);
    for (const [name, value] of Object.entries(API_SECURITY_HEADERS))
      expect(setHeader).toHaveBeenCalledWith(name, value);
    expect(next).toHaveBeenCalledOnce();
  });

  it('interdit le sniffing, les cadres et toute ressource chargée', () => {
    expect(API_SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    expect(API_SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    expect(API_SECURITY_HEADERS['Content-Security-Policy']).toContain("default-src 'none'");
    expect(API_SECURITY_HEADERS['Strict-Transport-Security']).toContain('max-age=31536000');
  });
});

describe('useSecurityHeaders', () => {
  it('masque x-powered-by et branche le middleware', () => {
    const app = { disable: vi.fn(), use: vi.fn() };
    useSecurityHeaders(app as unknown as NestExpressApplication);
    expect(app.disable).toHaveBeenCalledWith('x-powered-by');
    expect(app.use).toHaveBeenCalledWith(securityHeaders);
  });
});
