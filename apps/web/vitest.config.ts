import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'e2e/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/**/*.{ts,tsx}',
        'e2e/config.ts',
        'auth-rewrites.mjs',
        'security-headers.mjs',
        'public/sw.js',
      ],
      exclude: ['src/**/*.test.{ts,tsx}'],
    },
  },
});
