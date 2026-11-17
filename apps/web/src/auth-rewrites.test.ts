import { afterEach, describe, expect, it, vi } from 'vitest';
import { authRewrites } from '../auth-rewrites.mjs';

afterEach(() => vi.unstubAllEnvs());

describe('authRewrites', () => {
  it("relaie /api/auth/* et /api/onboarding/* vers l'API configurée", () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');
    expect(authRewrites()).toEqual([
      { source: '/api/auth/:path*', destination: 'https://api.example.com/auth/:path*' },
      {
        source: '/api/onboarding/:path*',
        destination: 'https://api.example.com/onboarding/:path*',
      },
    ]);
  });
  it("vise l'API locale par défaut", () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    expect(authRewrites()[0]?.destination).toBe('http://localhost:4000/auth/:path*');
  });
});
