import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

type Step = { uses?: string; run?: string; if?: string; with?: Record<string, unknown> };
const wf = parse(readFileSync('../../.github/workflows/cd-staging.yml', 'utf8')) as {
  on: { push: { branches: string[] } };
  permissions: Record<string, string>;
  jobs: {
    images: {
      permissions: Record<string, string>;
      strategy: { matrix: { app: string[] } };
      steps: Step[];
    };
    deploy: { needs: string; permissions?: unknown; env: Record<string, string>; steps: Step[] };
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

describe('job deploy', () => {
  const { needs, env, steps: deploySteps, permissions: deployPerms } = wf.jobs.deploy;
  const find = (text: string) => deploySteps.findIndex((s) => s.run?.includes(text));
  const guarded = (text: string) => deploySteps[find(text)]?.if;

  it("attend les images et n'écrit rien (droits en lecture seule)", () => {
    expect(needs).toBe('images');
    expect(deployPerms).toBeUndefined();
    expect(wf.permissions).toEqual({ contents: 'read' });
  });
  it('lit ses secrets et sa variable depuis le dépôt, sans valeur dans le fichier', () => {
    expect(env).toEqual({
      DATABASE_URL: '${{ secrets.STAGING_DATABASE_URL }}',
      DEPLOY_HOOK: '${{ secrets.RENDER_DEPLOY_HOOK_URL }}',
      API_URL: '${{ vars.STAGING_API_URL }}',
    });
  });
  it('migre, puis déclenche Render, puis teste /health/ready', () => {
    const order = ['prisma migrate deploy', '"$DEPLOY_HOOK"', '/health/ready'].map(find);
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
  it("saute chaque étape tant que son secret ou sa variable n'existe pas", () => {
    expect(guarded('prisma migrate deploy')).toBe("env.DATABASE_URL != ''");
    expect(guarded('"$DEPLOY_HOOK"')).toBe("env.DEPLOY_HOOK != ''");
    expect(guarded('/health/ready')).toBe("env.API_URL != ''");
  });
  it("n'affiche jamais le hook dans les logs", () => {
    const hook = deploySteps[find('"$DEPLOY_HOOK"')]?.run ?? '';
    expect(hook).toContain('--silent');
    expect(hook).toContain('--output /dev/null');
    expect(hook).not.toMatch(/echo|set -x/);
  });
  it("échoue si l'API ne répond pas après les essais", () => {
    const smoke = deploySteps[find('/health/ready')]?.run ?? '';
    expect(smoke).toContain('--fail');
    expect(smoke).toContain('exit 1');
  });
});
