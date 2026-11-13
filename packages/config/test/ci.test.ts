import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

type Step = { uses?: string; run?: string; if?: string };
const ci = parse(readFileSync('../../.github/workflows/ci.yml', 'utf8')) as {
  on: { pull_request: unknown; push: { branches: string[] } };
  permissions: Record<string, string>;
  jobs: { quality: { env: Record<string, string>; steps: Step[] } };
};
const steps = ci.jobs.quality.steps;
const runs = steps.map((s) => s.run).filter(Boolean);

describe('workflow ci.yml', () => {
  it('se lance sur chaque PR et sur main', () => {
    expect(ci.on.pull_request).toBeDefined();
    expect(ci.on.push.branches).toEqual(['main']);
  });
  it('a des droits en lecture seule', () => {
    expect(ci.permissions).toEqual({ contents: 'read' });
  });
  it('installe avec le lockfile figé', () => {
    expect(runs).toContain('pnpm install --frozen-lockfile');
  });
  it('enchaîne format, lint, typecheck et tests', () => {
    const order = ['prettier --check', 'pnpm lint', 'pnpm typecheck', 'pnpm test'].map((c) =>
      runs.findIndex((r) => r?.includes(c)),
    );
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
  it("vérifie les règles d'architecture après le lint", () => {
    expect(runs.indexOf('pnpm depcruise')).toBeGreaterThan(runs.indexOf('pnpm lint'));
  });
  it('ne lance aucune action sans version (tag majeur ou SHA complet)', () => {
    for (const s of steps.filter((x) => x.uses)) expect(s.uses).toMatch(/@(v\d+|[0-9a-f]{40})$/);
  });
  it("lance l'analyse SonarQube après les tests, seulement si le jeton existe", () => {
    const i = steps.findIndex((s) => s.uses?.startsWith('SonarSource/sonarqube-scan-action@'));
    expect(i).toBeGreaterThan(steps.findIndex((s) => s.run === 'pnpm test'));
    expect(steps[i]?.uses).toMatch(/@[0-9a-f]{40}$/);
    expect(steps[i]?.if).toBe("env.SONAR_TOKEN != ''");
    expect(ci.jobs.quality.env.SONAR_TOKEN).toBe('${{ secrets.SONAR_TOKEN }}');
  });
});

describe('sonar-project.properties', () => {
  const props = readFileSync('../../sonar-project.properties', 'utf8');
  it('attend le quality gate et lit les rapports lcov', () => {
    expect(props).toContain('sonar.qualitygate.wait=true');
    expect(props).toContain('sonar.javascript.lcov.reportPaths=');
  });
  it('exclut seulement le point d’entrée main.ts de la couverture', () => {
    expect(props).toContain('sonar.coverage.exclusions=**/main.ts');
  });
  it('ne contient ni jeton ni clé de projet', () => {
    expect(props).not.toMatch(/sonar\.(token|login|password|projectKey|organization)/);
  });
});
