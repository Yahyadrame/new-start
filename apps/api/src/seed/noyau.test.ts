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
  it('upsert chaque ligne dans une seule transaction et compte le résultat', async () => {
    const word = { upsert: vi.fn((a: unknown) => a) };
    const expression = { upsert: vi.fn((a: unknown) => a) };
    const $transaction = vi.fn(async () => []);
    const res = await seedNoyau(
      { word, expression, $transaction },
      { mots: MOTS, expressions: EXPR },
    );
    expect(res).toEqual({ words: 2, expressions: 1 });
    expect(word.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 2 } }));
    expect(expression.upsert).toHaveBeenCalledTimes(1);
    expect($transaction).toHaveBeenCalledTimes(1);
    expect(($transaction.mock.calls[0] as unknown[][])[0]).toHaveLength(3);
  });
  it('ne touche pas la base si un fichier est invalide', async () => {
    const $transaction = vi.fn();
    const db = { word: { upsert: vi.fn() }, expression: { upsert: vi.fn() }, $transaction };
    await expect(seedNoyau(db, { mots: 'a\n1,x\n', expressions: EXPR })).rejects.toThrow(
      'mots.csv',
    );
    expect($transaction).not.toHaveBeenCalled();
  });
});
