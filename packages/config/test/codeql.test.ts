import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

type Step = { uses?: string; with?: Record<string, string> };
const wf = parse(readFileSync('../../.github/workflows/codeql.yml', 'utf8')) as {
  on: { pull_request: unknown; push: { branches: string[] }; schedule: { cron: string }[] };
  permissions: Record<string, string>;
  jobs: { analyze: { permissions: Record<string, string>; steps: Step[] } };
};
const steps = wf.jobs.analyze.steps;

describe('workflow codeql.yml', () => {
  it('se lance sur chaque PR, sur main et une fois par semaine', () => {
    expect(wf.on.pull_request).toBeDefined();
    expect(wf.on.push.branches).toEqual(['main']);
    expect(wf.on.schedule).toHaveLength(1);
  });
  it('lit le code, et seul le job écrit les alertes de sécurité', () => {
    expect(wf.permissions).toEqual({ contents: 'read' });
    expect(wf.jobs.analyze.permissions).toEqual({ contents: 'read', 'security-events': 'write' });
  });
  it('épingle chaque action par son SHA', () => {
    for (const s of steps) expect(s.uses).toMatch(/@[0-9a-f]{40}( |$)/);
  });
  it('analyse JavaScript et TypeScript avec les requêtes de sécurité étendues', () => {
    const init = steps.find((s) => s.uses?.includes('codeql-action/init'));
    expect(init?.with).toEqual({
      languages: 'javascript-typescript',
      queries: 'security-extended',
    });
    expect(steps.some((s) => s.uses?.includes('codeql-action/analyze'))).toBe(true);
  });
});
