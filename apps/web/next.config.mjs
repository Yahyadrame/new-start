import { fileURLToPath, URL } from 'node:url';
import { apiRewrites } from './api-rewrites.mjs';
import { securityHeaders } from './security-headers.mjs';

/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ['@newstart/ui'],
  reactStrictMode: true,
  poweredByHeader: false,
  // Image Docker (NS-004) : serveur autonome ; la racine du monorepo permet d'y inclure packages/ui.
  output: 'standalone',
  rewrites: async () => apiRewrites(),
  headers: async () => securityHeaders(),
  outputFileTracingRoot: fileURLToPath(new URL('../..', import.meta.url)),
};
