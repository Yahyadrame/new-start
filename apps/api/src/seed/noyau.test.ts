import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { parseCsv, seedNoyau, toExpressions, toWords } from './noyau.js';

const MOTS =
  'Rang,Mot,Traduction,Semaine,Fréquence (par million de mots)\n1,the,"le, la, les",Semaine 1,37265.1\n2,you,"tu, vous",Semaine 2,29674.2\n';
const EXPR =
  'Rang,Expression,Sens,Situation,Registre,Scène,Semaine,Fréquence\n1,You know,"tu sais ; tu vois",Gérer la conversation,Familier,Coloc & amis,Semaine 1,2485.3\n';

describe('parseCsv', () => {
  it("ignore l'en-tête, le BOM et les lignes vides", () => {
    expect(parseCsv(`${String.fromCodePoint(0xfeff)}a,b\n1,2\n\n3,4\r\n`)).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });
  it('garde les virgules entre guillemets dans le même champ', () => {
    expect(parseCsv('a,b\n1,"x, y"\n')).toEqual([['1', 'x, y']]);
  });
});

describe('toWords / toExpressions', () => {
  it('convertit rang, semaine et fréquence en nombres', () => {
    expect(toWords(MOTS)[0]).toEqual({
      id: 1,
      text: 'the',
      translation: 'le, la, les',
      week: 1,
      frequency: 37265.1,
    });
    expect(toExpressions(EXPR)[0]).toEqual({
      id: 1,
      text: 'You know',
      meaningFr: 'tu sais ; tu vois',
      situation: 'Gérer la conversation',
      register: 'Familier',
      sceneType: 'Coloc & amis',
      week: 1,
      frequency: 2485.3,
    });
  });
  it('refuse une ligne avec le mauvais nombre de colonnes', () => {
    expect(() => toWords('a,b\n1,the\n')).toThrow(
      'mots.csv : 5 colonnes attendues, 2 trouvées (the)',
    );
    expect(() => toExpressions('a,b\n1,x\n')).toThrow('expressions.csv');
  });
  it('lit les vrais fichiers du dépôt : 1 000 mots et 339 expressions, rangs uniques', () => {
    const read = (n: string) =>
      readFileSync(new URL(`../../../../data/${n}`, import.meta.url), 'utf8');
    const words = toWords(read('mots.csv'));
    const expressions = toExpressions(read('expressions.csv'));
    expect(words).toHaveLength(1000);
    expect(expressions).toHaveLength(339);
    expect(new Set(words.map((w) => w.id)).size).toBe(1000);
    expect(new Set(expressions.map((e) => e.text)).size).toBe(339);
    expect(
      [...words, ...expressions].every(
        (r) => r.week >= 1 && r.week <= 4 && Number.isFinite(r.frequency),
      ),
    ).toBe(true);
  });
});

describe('seedNoyau', () => {
  const fakeDb = () => {
    const executeRaw = vi.fn(async () => 0);
    const db = {
      $executeRaw: executeRaw,
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(db)),
    };
    return { db, executeRaw };
  };
  it('envoie une requête par table, avec une colonne par tableau, dans une transaction', async () => {
    const { db, executeRaw } = fakeDb();
    const res = await seedNoyau(db as never, { mots: MOTS, expressions: EXPR });
    expect(res).toEqual({ words: 2, expressions: 1 });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(executeRaw).toHaveBeenCalledTimes(2);
    const [wordSql, ...wordArgs] = executeRaw.mock.calls[0] as unknown as [string[], ...unknown[]];
    expect(wordSql.join('?')).toContain('ON CONFLICT ("id") DO UPDATE');
    expect(wordArgs).toEqual([
      [1, 2],
      ['the', 'you'],
      ['le, la, les', 'tu, vous'],
      [1, 2],
      [37265.1, 29674.2],
    ]);
    const exprArgs = (executeRaw.mock.calls[1] as unknown as [string[], ...unknown[]]).slice(1);
    expect(exprArgs).toHaveLength(8);
    expect(exprArgs[1]).toEqual(['You know']);
  });
  it('ne touche pas la base si un fichier est invalide', async () => {
    const { db, executeRaw } = fakeDb();
    await expect(seedNoyau(db as never, { mots: 'a\n1,x\n', expressions: EXPR })).rejects.toThrow(
      'mots.csv',
    );
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(executeRaw).not.toHaveBeenCalled();
  });
});
