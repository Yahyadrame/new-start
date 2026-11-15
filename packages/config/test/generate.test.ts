import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { main, moduleFiles, names, run } from '../generators/generate.mjs';

const dirs: string[] = [];
const sandbox = () => {
  const dir = mkdtempSync(join(tmpdir(), 'gen-'));
  dirs.push(dir);
  return dir;
};
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

describe('names', () => {
  it('décline un nom kebab-case', () => {
    expect(names('quiz-game')).toEqual({
      kebab: 'quiz-game',
      pascal: 'QuizGame',
      camel: 'quizGame',
      token: 'QUIZ_GAME',
    });
  });
  it.each(['QuizGame', 'quiz_game', '1quiz', 'quiz-', '', 'quiz game'])('refuse « %s »', (n) => {
    expect(() => names(n)).toThrow('kebab-case');
  });
});

describe('fichiers générés', () => {
  it('le module a ses quatre couches, son module Nest et un test par fichier de code', () => {
    const paths = Object.keys(moduleFiles('quiz'));
    for (const dir of ['domain', 'application', 'infrastructure', 'interface']) {
      expect(paths.some((p) => p.startsWith(`${dir}/`))).toBe(true);
    }
    expect(paths).toContain('quiz.module.ts');
    for (const p of paths.filter((f) => /^(application|infrastructure|interface)\//.test(f))) {
      if (!p.endsWith('.test.ts')) expect(paths).toContain(p.replace(/\.ts$/, '.test.ts'));
    }
  });
});

describe('run', () => {
  it('écrit un module dans apps/api et rappelle de le déclarer', () => {
    const root = sandbox();
    const { written, hint } = run('module', 'quiz', root);
    expect(written).toContain(join(root, 'apps/api/src/modules/quiz/quiz.module.ts'));
    expect(readFileSync(written[0] as string, 'utf8')).toContain('QuizRepository');
    expect(hint).toContain('QuizModule');
  });
  it('refuse d’écraser un dossier existant', () => {
    const root = sandbox();
    run('module', 'quiz', root);
    expect(() => run('module', 'quiz', root)).toThrow('existe déjà');
  });
  it('refuse un type inconnu', () => {
    expect(() => run('feature', 'quiz', sandbox())).toThrow('module');
  });
});

describe('main', () => {
  it('renvoie 0 et la liste des fichiers créés', () => {
    const { code, out } = main(['module', 'quiz'], sandbox());
    expect(code).toBe(0);
    expect(out).toContain('quiz.module.ts');
  });
  it("renvoie 1 et le message d'erreur sans nom", () => {
    expect(main(['module'], sandbox())).toEqual({
      code: 1,
      out: expect.stringContaining('kebab-case'),
    });
  });
});
