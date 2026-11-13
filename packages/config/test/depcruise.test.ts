import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { cruise, type IConfiguration } from 'dependency-cruiser';
import { afterAll, describe, expect, it } from 'vitest';

const config = createRequire(import.meta.url)('../../../.dependency-cruiser.cjs') as IConfiguration;
const root = mkdtempSync(join(tmpdir(), 'depcruise-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

/** Écrit les fichiers, analyse l'arbre et renvoie les noms de règles violées. */
async function violations(files: Record<string, string>): Promise<string[]> {
  const dir = mkdtempSync(join(root, 'case-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  const { output } = await cruise(
    ['apps', 'packages'].filter(
      (d) => files[d] || Object.keys(files).some((f) => f.startsWith(`${d}/`)),
    ),
    {
      ruleSet: config,
      validate: true,
      baseDir: dir,
    } as never,
  );
  const summary = (output as { summary: { violations: { rule: { name: string } }[] } }).summary;
  return summary.violations.map((v) => v.rule.name);
}

const web = 'apps/web/src';
const mod = 'apps/api/src/modules';

describe('règles d’architecture (dependency-cruiser)', () => {
  it('accepte un front respectant app → features → entities → shared', async () => {
    expect(
      await violations({
        [`${web}/app/page.ts`]: "import '../features/chat/index';",
        [`${web}/features/chat/index.ts`]: "import '../../entities/user';",
        [`${web}/entities/user.ts`]: "import '../shared/api';",
        [`${web}/shared/api.ts`]: 'export {};',
      }),
    ).toEqual([]);
  });

  it.each([
    [
      'shared vers entities',
      `${web}/shared/a.ts`,
      "import '../entities/b';",
      `${web}/entities/b.ts`,
      'web-shared-ne-remonte-pas',
    ],
    [
      'entities vers features',
      `${web}/entities/a.ts`,
      "import '../features/x/index';",
      `${web}/features/x/index.ts`,
      'web-entities-ne-remonte-pas',
    ],
    [
      'features vers app',
      `${web}/features/x/index.ts`,
      "import '../../app/page';",
      `${web}/app/page.ts`,
      'web-features-ne-remonte-pas',
    ],
    [
      'feature vers feature',
      `${web}/features/x/index.ts`,
      "import '../y/index';",
      `${web}/features/y/index.ts`,
      'web-pas-de-fonctionnalite-vers-fonctionnalite',
    ],
    [
      'fichier interne d’une feature',
      `${web}/app/page.ts`,
      "import '../features/x/hooks/use-x';",
      `${web}/features/x/hooks/use-x.ts`,
      'web-fonctionnalite-par-son-index',
    ],
    [
      'package vers app',
      'packages/ui/a.ts',
      "import '../../apps/web/src/shared/b';",
      `${web}/shared/b.ts`,
      'packages-sans-apps',
    ],
    [
      'domain vers infrastructure',
      `${mod}/chat/domain/a.ts`,
      "import '../infrastructure/b';",
      `${mod}/chat/infrastructure/b.ts`,
      'back-domain-pur',
    ],
    [
      'application vers interface',
      `${mod}/chat/application/a.ts`,
      "import '../interface/b';",
      `${mod}/chat/interface/b.ts`,
      'back-application-sans-infra',
    ],
    [
      'infrastructure vers interface',
      `${mod}/chat/infrastructure/a.ts`,
      "import '../interface/b';",
      `${mod}/chat/interface/b.ts`,
      'back-infrastructure-sans-interface',
    ],
    [
      'module vers module',
      `${mod}/chat/application/a.ts`,
      "import '../../series/domain/b';",
      `${mod}/series/domain/b.ts`,
      'back-pas-de-module-vers-module',
    ],
  ])('refuse %s', async (_nom, from, code, to, rule) => {
    expect(await violations({ [from]: code, [to]: 'export {};' })).toContain(rule);
  });

  it('refuse un cycle', async () => {
    expect(
      await violations({
        'packages/a/a.ts': "import './b';",
        'packages/a/b.ts': "import './a';",
      }),
    ).toContain('no-circular');
  });
});
