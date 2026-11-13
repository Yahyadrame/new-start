import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

type Step = { uses?: string; run?: string; with?: Record<string, unknown> };
const wf = parse(readFileSync('../../.github/workflows/cd-staging.yml', 'utf8')) as {
  on: { push: { branches: string[] } };
  permissions: Record<string, string>;
  jobs: {
    images: {
      permissions: Record<string, string>;
      strategy: { matrix: { app: string[] } };
      steps: Step[];
    };
  };
};
const { steps, strategy, permissions } = wf.jobs.images;
const index = (prefix: string) => steps.findIndex((s) => s.uses?.startsWith(prefix));

describe('workflow cd-staging.yml', () => {
  it('se lance sur main seulement, avec des droits en lecture par défaut', () => {
    expect(wf.on.push.branches).toEqual(['main']);
    expect(wf.permissions).toEqual({ contents: 'read' });
  });
  it("construit les trois images et n'a le droit d'écrire que des paquets", () => {
    expect(strategy.matrix.app).toEqual(['api', 'worker', 'web']);
    expect(permissions).toEqual({ contents: 'read', packages: 'write' });
  });
  it('épingle les actions tierces par SHA complet', () => {
    for (const s of steps.filter((x) => x.uses && !x.uses.startsWith('actions/')))
      expect(s.uses).toMatch(/@[0-9a-f]{40}$/);
  });
  it('scanne avec Trivy, en échec sur CRITICAL, avant de se connecter et de publier', () => {
    const trivy = steps[index('aquasecurity/trivy-action@')];
    expect(trivy?.with).toMatchObject({ severity: 'CRITICAL', 'exit-code': '1' });
    expect(index('aquasecurity/trivy-action@')).toBeLessThan(index('docker/login-action@'));
    const publish = steps.filter((s) => s.uses?.startsWith('docker/build-push-action@')).at(-1);
    expect(publish?.with?.['push']).toBe(true);
    expect(steps.indexOf(publish as Step)).toBeGreaterThan(index('docker/login-action@'));
  });
  it('met le nom de l’image en minuscules', () => {
    expect(steps.some((s) => s.run?.includes('${GITHUB_REPOSITORY_OWNER,,}'))).toBe(true);
  });
});
