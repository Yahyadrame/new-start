import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import boundaries from 'eslint-plugin-boundaries';

const web = 'apps/web/src';
const back = 'apps/{api,worker}/src/modules';

// Couches de docs/06-architecture.md : app → features → entities → shared ; domain → application → infrastructure / interface.
export const architecture = {
  files: [`${web}/**/*.{ts,tsx}`, `${back}/**/*.ts`],
  plugins: { boundaries },
  settings: {
    'boundaries/elements': [
      { type: 'web-app', pattern: `${web}/app` },
      { type: 'web-feature', pattern: `${web}/features/*`, capture: ['name'] },
      { type: 'web-entity', pattern: `${web}/entities` },
      { type: 'web-shared', pattern: `${web}/shared` },
      { type: 'back-domain', pattern: `${back}/*/domain`, capture: ['module'] },
      { type: 'back-application', pattern: `${back}/*/application`, capture: ['module'] },
      { type: 'back-infrastructure', pattern: `${back}/*/infrastructure`, capture: ['module'] },
      { type: 'back-interface', pattern: `${back}/*/interface`, capture: ['module'] },
    ],
  },
  rules: {
    'boundaries/dependencies': [
      'error',
      {
        default: 'allow',
        policies: [
          {
            from: { element: { type: 'web-shared' } },
            disallow: { to: { element: { types: ['web-entity', 'web-feature', 'web-app'] } } },
          },
          {
            from: { element: { type: 'web-entity' } },
            disallow: { to: { element: { types: ['web-feature', 'web-app'] } } },
          },
          {
            from: { element: { type: 'web-feature' } },
            disallow: { to: { element: { type: 'web-app' } } },
          },
          {
            from: { element: { type: 'back-domain' } },
            disallow: {
              to: {
                element: { types: ['back-application', 'back-infrastructure', 'back-interface'] },
              },
            },
          },
          {
            from: { element: { type: 'back-application' } },
            disallow: { to: { element: { types: ['back-infrastructure', 'back-interface'] } } },
          },
          {
            from: { element: { type: 'back-infrastructure' } },
            disallow: { to: { element: { type: 'back-interface' } } },
          },
        ],
      },
    ],
  },
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/generated/**',
      '**/next-env.d.ts',
      'design/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  security.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // Les modules NestJS sont des classes vides portées par un décorateur.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { module: 'writable' } },
  },
  architecture,
);
