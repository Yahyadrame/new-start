import { fileURLToPath, URL } from 'node:url';
import { authRewrites } from './auth-rewrites.mjs';

/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ['@newstart/ui'],
  reactStrictMode: true,
  poweredByHeader: false,
  // Image Docker (NS-004) : serveur autonome ; la racine du monorepo permet d'y inclure packages/ui.
  output: 'standalone',
  rewrites: async () => authRewrites(),
  outputFileTracingRoot: fileURLToPath(new URL('../..', import.meta.url)),
};
