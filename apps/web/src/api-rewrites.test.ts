import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRewrites } from '../api-rewrites.mjs';

afterEach(() => vi.unstubAllEnvs());

describe('apiRewrites', () => {
  it("relaie tout /api/* vers l'API configurée", () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');
    expect(apiRewrites()).toEqual([
      { source: '/api/:path*', destination: 'https://api.example.com/:path*' },
    ]);
  });
  it("vise l'API locale par défaut", () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    expect(apiRewrites()[0]?.destination).toBe('http://localhost:4000/:path*');
  });
});
