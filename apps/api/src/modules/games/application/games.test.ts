import { describe, expect, it, vi } from 'vitest';
import { GamesService, type GamesStore } from './games.js';

const pool = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  text: `Expression ${i + 1}`,
  meaningFr: `Sens ${i + 1}`,
  week: 1,
}));
const service = (expressions = pool) =>
  new GamesService({ expressions: vi.fn().mockResolvedValue(expressions) } as GamesStore);

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
