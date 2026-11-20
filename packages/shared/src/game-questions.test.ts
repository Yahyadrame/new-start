import { describe, expect, it } from 'vitest';
import {
  buildMatch,
  buildMissingWord,
  buildTrueFalse,
  MatchQuestion,
  MissingWordQuestion,
  TrueFalseQuestion,
  type GameExpression,
} from './game-questions';

const make = (
  id: number,
  text: string,
  meaningFr: string,
  week = 1,
  example?: string,
): GameExpression => ({
  id,
  text,
  meaningFr,
  week,
  ...(example && { example }),
});
const pool = [
  make(1, 'Break a leg', 'Bonne chance', 1, 'Break a leg tonight!'),
  make(2, 'Piece of cake', 'Très facile', 1),
  make(3, 'Hit the sack', 'Aller se coucher', 1),
  make(4, 'Under the weather', 'Pas en forme', 1),
  make(5, 'Spill the beans', 'Vendre la mèche', 2),
];

/** Générateur déterministe : rend les valeurs données en boucle. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length] as number;
};

describe('buildTrueFalse', () => {
  it('propose la bonne traduction quand le tirage tombe en dessous de 0,5', () => {
    const q = buildTrueFalse(pool[0] as GameExpression, pool, seq(0.1));
    expect(q).toMatchObject({ meaningFr: 'Bonne chance', answer: true });
    expect(TrueFalseQuestion.safeParse(q).success).toBe(true);
  });

  it('propose le sens d’une autre expression sinon', () => {
    const q = buildTrueFalse(pool[0] as GameExpression, pool, seq(0.9, 0));
    expect(q.answer).toBe(false);
    expect(q.meaningFr).not.toBe('Bonne chance');
    expect(pool.some((e) => e.meaningFr === q.meaningFr)).toBe(true);
  });

  it('reste vrai quand il n’y a aucune autre traduction à proposer', () => {
    const q = buildTrueFalse(pool[0] as GameExpression, [pool[0] as GameExpression], seq(0.9));
    expect(q.answer).toBe(true);
  });
});

describe('buildMissingWord', () => {
  const target = pool[0] as GameExpression;

  it('cache l’expression dans la phrase et mêle la bonne réponse à trois leurres', () => {
    const q = buildMissingWord(target, pool, Math.random) as MissingWordQuestion;
    expect(q.sentence).toBe('___ tonight!');
    expect(q.choices).toHaveLength(4);
    expect(q.choices).toContain('Break a leg');
    expect(new Set(q.choices).size).toBe(4);
    expect(MissingWordQuestion.safeParse(q).success).toBe(true);
  });

  it('prend les leurres de la même semaine avant les autres', () => {
    for (let n = 0; n < 20; n++) {
      const q = buildMissingWord(target, pool, Math.random) as MissingWordQuestion;
      expect(q.choices).not.toContain('Spill the beans');
    }
  });

  it('complète avec une autre semaine quand elle manque de leurres', () => {
    const small = [target, pool[1], pool[2], pool[4]] as GameExpression[];
    const q = buildMissingWord(target, small, Math.random) as MissingWordQuestion;
    expect(q.choices).toContain('Spill the beans');
  });

  it('retrouve l’expression sans tenir compte de la casse', () => {
    const t = make(9, 'Break a leg', 'Bonne chance', 1, 'I said break a leg!');
    expect((buildMissingWord(t, pool, Math.random) as MissingWordQuestion).sentence).toBe(
      'I said ___!',
    );
  });

  it.each([
    ['sans phrase d’exemple', make(2, 'Piece of cake', 'Très facile')],
    [
      'dont la phrase ne contient pas l’expression',
      make(2, 'Piece of cake', 'Très facile', 1, 'Easy.'),
    ],
  ])('rend null %s', (_label, t) => expect(buildMissingWord(t, pool, Math.random)).toBeNull());

  it('rend null sans trois leurres', () => {
    expect(buildMissingWord(target, pool.slice(0, 3), Math.random)).toBeNull();
  });
});

describe('buildMatch', () => {
  it('rend quatre paires et leurs sens mélangés', () => {
    const q = buildMatch(pool, Math.random) as MatchQuestion;
    expect(MatchQuestion.safeParse(q).success).toBe(true);
    expect(q.pairs.map((p) => p.expressionId).sort()).toEqual(
      q.meanings.map((m) => m.expressionId).sort(),
    );
  });

  it('ne met jamais deux expressions de même sens dans une partie', () => {
    const dup = [...pool, make(6, 'Good luck', 'Bonne chance')];
    for (let n = 0; n < 30; n++) {
      const q = buildMatch(dup, Math.random) as MatchQuestion;
      expect(new Set(q.meanings.map((m) => m.meaningFr)).size).toBe(4);
    }
  });

  it('rend null avec moins de quatre sens différents', () => {
    expect(buildMatch(pool.slice(0, 3), Math.random)).toBeNull();
  });
});
