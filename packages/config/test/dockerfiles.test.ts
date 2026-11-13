import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Garde-fous des Dockerfiles (NS-004) : multi-étapes, sans root, avec HEALTHCHECK.
describe.each(['api', 'worker', 'web'])('apps/%s/Dockerfile', (app) => {
  const file = readFileSync(`../../apps/${app}/Dockerfile`, 'utf8');
  const lines = file.split('\n');
  const stages = lines.filter((l) => /^FROM /.test(l));
  const lastFrom = lines.map((l) => /^FROM /.test(l)).lastIndexOf(true);
  const finalStage = lines.slice(lastFrom).join('\n');

  it('a au moins deux étapes (build puis exécution)', () => {
    expect(stages.length).toBeGreaterThanOrEqual(2);
  });
  it("s'exécute sans root dans l'étape finale", () => {
    expect(finalStage).toMatch(/^USER node$/m);
  });
  it('déclare un HEALTHCHECK dans l’étape finale', () => {
    expect(finalStage).toMatch(/^HEALTHCHECK /m);
  });
  it('installe avec le lockfile figé', () => {
    expect(file).toContain('pnpm install --frozen-lockfile');
  });
});

describe('.dockerignore', () => {
  const ignore = readFileSync('../../.dockerignore', 'utf8').split('\n');
  it.each(['**/node_modules', '.git', '.env', '.env.*'])('exclut %s du contexte', (p) => {
    expect(ignore).toContain(p);
  });
  it('garde .env.example', () => {
    expect(ignore).toContain('!.env.example');
  });
});

describe('apps/web/next.config.mjs', () => {
  const config = readFileSync('../../apps/web/next.config.mjs', 'utf8');
  it('produit la sortie standalone attendue par le Dockerfile', () => {
    expect(config).toContain("output: 'standalone'");
    expect(config).toContain('outputFileTracingRoot');
  });
});
