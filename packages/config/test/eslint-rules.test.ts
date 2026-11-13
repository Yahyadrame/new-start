import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import config from '../eslint/index.mjs';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: config as unknown as object[],
});
const lint = async (code: string) =>
  (await eslint.lintText(code, { filePath: 'src/a.ts' }))[0]?.messages ?? [];

describe('règles ESLint partagées', () => {
  it('accepte une classe vide portée par un décorateur (module NestJS)', async () => {
    const code =
      'declare function Module(o: object): ClassDecorator;\n@Module({})\nexport class AppModule {}\n';
    expect(await lint(code)).toEqual([]);
  });
  it('refuse une classe vide sans décorateur', async () => {
    expect((await lint('export class Vide {}\n')).map((m) => m.ruleId)).toContain(
      '@typescript-eslint/no-extraneous-class',
    );
  });
  it('refuse any', async () => {
    expect((await lint('export const x: any = 1;\n')).map((m) => m.ruleId)).toContain(
      '@typescript-eslint/no-explicit-any',
    );
  });
});
