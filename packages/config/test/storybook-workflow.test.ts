import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

type Job = { permissions?: Record<string, string>; steps?: { uses?: string; run?: string }[] };
const wf = parse(readFileSync('../../.github/workflows/storybook.yml', 'utf8')) as {
  on: { push: { branches: string[] } };
  permissions: Record<string, string>;
  jobs: { build: Job; deploy: Job };
};

describe('workflow storybook.yml', () => {
  it('ne publie que depuis main', () => {
    expect(wf.on.push.branches).toEqual(['main']);
  });
  it('garde la lecture seule par défaut et réserve pages:write au déploiement', () => {
    expect(wf.permissions).toEqual({ contents: 'read' });
    expect(wf.jobs.build.permissions).toBeUndefined();
    expect(wf.jobs.deploy.permissions).toEqual({ pages: 'write', 'id-token': 'write' });
  });
  it('construit Storybook avec le lockfile figé avant de publier', () => {
    const runs = (wf.jobs.build.steps ?? []).map((s) => s.run);
    expect(runs).toContain('pnpm install --frozen-lockfile');
    expect(runs).toContain('pnpm --filter @newstart/ui build-storybook');
  });
  it('ne lance aucune action sans version', () => {
    const steps = [...(wf.jobs.build.steps ?? []), ...(wf.jobs.deploy.steps ?? [])];
    for (const s of steps.filter((x) => x.uses)) expect(s.uses).toMatch(/@(v\d+|[0-9a-f]{40})$/);
  });
});
