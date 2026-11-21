import { describe, expect, it, vi } from 'vitest';
import {
  DAILY_BONUS_XP,
  DAILY_QUESTIONS,
  GamesService,
  seededRng,
  type GamesStore,
} from './games.js';

const pool = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  text: `Expression ${i + 1}`,
  meaningFr: `Sens ${i + 1}`,
  week: 1,
}));
const service = (expressions = pool) =>
  new GamesService({
    expressions: vi.fn().mockResolvedValue(expressions),
    addXp: vi.fn(),
  } as unknown as GamesStore);

describe('GamesService.questions', () => {
  it('rend le nombre demandé de questions Vrai ou faux, sur des expressions différentes', async () => {
    const qs = await service().questions('true-false', 5);
    expect(qs).toHaveLength(5);
    expect(qs.every((q) => q.kind === 'TRUE_FALSE')).toBe(true);
    expect(new Set(qs.map((q) => 'expressionId' in q && q.expressionId)).size).toBe(5);
  });

  it('rend au plus autant de Vrai ou faux que d’expressions', async () => {
    expect(await service(pool.slice(0, 3)).questions('true-false', 10)).toHaveLength(3);
  });

  it('rend des questions Associer de quatre paires', async () => {
    const qs = await service().questions('match', 3);
    expect(qs).toHaveLength(3);
    expect(qs.every((q) => q.kind === 'MATCH' && q.pairs.length === 4)).toBe(true);
  });

  it('ne rend aucune question Associer sans quatre sens différents', async () => {
    expect(await service(pool.slice(0, 3)).questions('match', 3)).toEqual([]);
  });
});

describe('GamesService.finish', () => {
  it('donne 5 XP par bonne réponse et rend le total', async () => {
    const addXp = vi.fn().mockResolvedValue(40);
    const svc = new GamesService({ expressions: vi.fn(), addXp } as unknown as GamesStore);
    expect(await svc.finish('u1', 3)).toEqual({ gained: 15, xp: 40 });
    expect(addXp).toHaveBeenCalledWith('u1', 15);
  });
});

const big = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  text: `Expression ${i + 1}`,
  meaningFr: `Sens ${i + 1}`,
  week: 1,
}));
const daily = (day: string, done = false, claim = true, expressions = big) => {
  const store = {
    expressions: vi.fn().mockResolvedValue([...expressions].reverse()),
    addXp: vi.fn().mockResolvedValue(100),
    today: vi.fn().mockResolvedValue({ day, done }),
    claimChallenge: vi.fn().mockResolvedValue(claim),
  };
  return { store, svc: new GamesService(store as unknown as GamesStore) };
};
const ids = (qs: { expressionId?: number }[]) => qs.map((q) => q.expressionId);

describe('seededRng', () => {
  it('rend la même suite pour la même graine, et une autre pour une autre', () => {
    const a = seededRng('2026-11-21');
    const b = seededRng('2026-11-21');
    const suite = (r: () => number) => [r(), r(), r()];
    expect(suite(a)).toEqual(suite(b));
    expect(suite(seededRng('2026-11-22'))).not.toEqual(suite(seededRng('2026-11-21')));
    expect(suite(a).every((n) => n >= 0 && n < 1)).toBe(true);
  });
});

describe('GamesService.daily', () => {
  it('rend dix Vrai ou faux, les mêmes à chaque appel du même jour', async () => {
    const first = await daily('2026-11-21').svc.daily('u1');
    const second = await daily('2026-11-21').svc.daily('u2');
    expect(first.questions).toHaveLength(DAILY_QUESTIONS);
    expect(first.questions.every((q) => q.kind === 'TRUE_FALSE')).toBe(true);
    expect(ids(first.questions)).toEqual(ids(second.questions));
  });

  it('change d’un jour à l’autre', async () => {
    const a = await daily('2026-11-21').svc.daily('u1');
    const b = await daily('2026-11-22').svc.daily('u1');
    expect(ids(a.questions)).not.toEqual(ids(b.questions));
  });

  it('dit si le défi est déjà terminé', async () => {
    const res = await daily('2026-11-21', true).svc.daily('u1');
    expect(res).toMatchObject({ day: '2026-11-21', done: true });
  });
});

describe('GamesService.finishDaily', () => {
  it('ajoute le bonus de 20 XP la première fois du jour', async () => {
    const { svc, store } = daily('2026-11-21');
    expect(await svc.finishDaily('u1', 7)).toEqual({
      gained: 35 + DAILY_BONUS_XP,
      bonus: 20,
      xp: 100,
    });
    expect(store.claimChallenge).toHaveBeenCalledWith('u1', '2026-11-21');
    expect(store.addXp).toHaveBeenCalledWith('u1', 55);
  });

  it('ne donne que l’XP des bonnes réponses les fois suivantes', async () => {
    const { svc, store } = daily('2026-11-21', true, false);
    expect(await svc.finishDaily('u1', 7)).toEqual({ gained: 35, bonus: 0, xp: 100 });
    expect(store.addXp).toHaveBeenCalledWith('u1', 35);
  });
});
