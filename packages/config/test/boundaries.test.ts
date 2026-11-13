import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { ESLint } from 'eslint';
import { afterAll } from 'vitest';
import { describe, expect, it } from 'vitest';
import config from '../eslint/index.mjs';

// Le plugin résout les imports sur le disque : on crée de vrais fichiers cibles.
const root = mkdtempSync(join(tmpdir(), 'boundaries-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));
const eslint = new ESLint({
  cwd: root,
  overrideConfigFile: true,
  overrideConfig: [
    ...(config as unknown as object[]),
    { settings: { 'boundaries/root-path': root } },
  ],
});
const web = join(root, 'apps/web/src');
const mod = join(root, 'apps/api/src/modules/chat');

async function messages(filePath: string, code: string) {
  const target = /import '([^']+)'/.exec(code)?.[1] ?? '';
  const targetFile = resolve(dirname(filePath), target);
  mkdirSync(dirname(targetFile), { recursive: true });
  writeFileSync(targetFile, 'export {};');
  const [result] = await eslint.lintText(code, { filePath });
  return result?.messages.filter((m) => m.ruleId?.startsWith('boundaries/')) ?? [];
}

describe('règles d’import (eslint-plugin-boundaries)', () => {
  it.each([
    ['shared vers entities', `${web}/shared/a.ts`, '../entities/b'],
    ['entities vers features', `${web}/entities/a.ts`, '../features/x/index'],
    ['features vers app', `${web}/features/x/a.ts`, '../../app/page'],
    ['domain vers infrastructure', `${mod}/domain/a.ts`, '../infrastructure/b'],
    ['application vers interface', `${mod}/application/a.ts`, '../interface/b'],
    ['infrastructure vers interface', `${mod}/infrastructure/a.ts`, '../interface/b'],
  ])('refuse %s', async (_nom, file, source) => {
    expect(await messages(file, `import '${source}.ts';`)).not.toHaveLength(0);
  });

  it.each([
    ['app vers features', `${web}/app/page.ts`, '../features/x/index'],
    ['features vers shared', `${web}/features/x/a.ts`, '../../shared/b'],
    ['application vers domain', `${mod}/application/a.ts`, '../domain/b'],
    ['interface vers application', `${mod}/interface/a.ts`, '../application/b'],
  ])('accepte %s', async (_nom, file, source) => {
    expect(await messages(file, `import '${source}.ts';`)).toHaveLength(0);
  });
});
