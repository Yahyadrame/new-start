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
  it('ne lance aucune action sans version', () => {
    for (const s of steps.filter((x) => x.uses)) expect(s.uses).toMatch(/@v\d+$/);
  });
  it("lance l'analyse SonarQube après les tests, seulement si le jeton existe", () => {
    const i = steps.findIndex((s) => s.uses?.startsWith('SonarSource/sonarqube-scan-action@'));
    expect(i).toBeGreaterThan(steps.findIndex((s) => s.run === 'pnpm test'));
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
  it('ne contient ni jeton ni clé de projet', () => {
    expect(props).not.toMatch(/sonar\.(token|login|password|projectKey|organization)/);
  });
});
