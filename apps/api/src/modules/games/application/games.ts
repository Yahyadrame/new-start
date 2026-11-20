import {
  buildMatch,
  buildTrueFalse,
  type GameExpression,
  type MatchQuestion,
  type Rng,
  type TrueFalseQuestion,
} from '@newstart/shared';

export const GAMES_STORE = Symbol('GAMES_STORE');

export interface GamesStore {
  /** Toutes les expressions du noyau (quelques centaines de lignes). */
  expressions(): Promise<GameExpression[]>;
}

export type GameType = 'true-false' | 'match';
export const GAME_TYPES: readonly GameType[] = ['true-false', 'match'];

export class GamesService {
  constructor(
    private readonly store: GamesStore,
    private readonly rng: Rng = Math.random,
  ) {}

  /** `count` questions du jeu ; moins si le noyau ne permet pas d'en faire autant. */
  async questions(type: GameType, count: number): Promise<(TrueFalseQuestion | MatchQuestion)[]> {
    const pool = await this.store.expressions();
    if (type === 'match') {
      return Array.from({ length: count }, () => buildMatch(pool, this.rng)).filter(
        (q): q is MatchQuestion => q !== null,
      );
    }
    const targets = [...pool].sort(() => this.rng() - 0.5).slice(0, count);
    return targets.map((t) => buildTrueFalse(t, pool, this.rng));
  }
}
