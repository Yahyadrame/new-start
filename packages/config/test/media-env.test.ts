import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');
const env = read('.env.example');
const values = read('infra/helm/new-start/values.yaml');
const names = (suffixes: string[]) =>
  ['B2', 'R2'].flatMap((provider) => suffixes.map((s) => `MEDIA_${provider}_${s}`));

describe('variables du stockage des médias', () => {
  it('sont toutes listées, vides, dans .env.example', () => {
    const all = ['MEDIA_PROVIDER', ...names(['ENDPOINT', 'REGION', 'BUCKET', 'KEY_ID', 'SECRET'])];
    for (const name of all) expect(env).toContain(`\n${name}=\n`);
  });

  it('range les clés dans les secrets et le reste dans la configuration, sans valeur', () => {
    for (const name of names(['KEY_ID', 'SECRET'])) {
      expect(values).toContain(`    - ${name}\n`);
      expect(values).not.toContain(`  ${name}:`);
    }
    for (const name of ['MEDIA_PROVIDER', ...names(['ENDPOINT', 'REGION', 'BUCKET'])]) {
      expect(values).toContain(`  ${name}: ''\n`);
    }
  });
});
