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
  /** Ajoute de l'XP à la personne et rend son total. */
  addXp(userId: string, amount: number): Promise<number>;
  /** Le jour de la personne (AAAA-MM-JJ, dans son fuseau) et si elle a déjà terminé le défi ce jour-là. */
  today(userId: string, now: Date): Promise<{ day: string; done: boolean }>;
  /** Marque le défi terminé ; vrai seulement la première fois du jour (appel atomique). */
  claimChallenge(userId: string, day: string): Promise<boolean>;
}

export type GameType = 'true-false' | 'match';
export const GAME_TYPES: readonly GameType[] = ['true-false', 'match'];

/** XP par bonne réponse (règle de NS-501). */
export const XP_PER_CORRECT = 5;

/** Questions du défi du jour et bonus d'XP de la première fois (choix du porteur, 2026-11-21). */
export const DAILY_QUESTIONS = 10;
export const DAILY_BONUS_XP = 20;

/** Générateur déterministe (mulberry32) : la même graine rend toujours la même suite. */
export function seededRng(seed: string): Rng {
  let a = 0;
  for (const c of seed) a = (Math.imul(31, a) + c.charCodeAt(0)) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class GamesService {
  constructor(
    private readonly store: GamesStore,
    private readonly rng: Rng = Math.random,
    private readonly now: () => Date = () => new Date(),
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

  /** Fin de partie : +5 XP par bonne réponse. */
  async finish(userId: string, correct: number) {
    const gained = correct * XP_PER_CORRECT;
    const xp = await this.store.addXp(userId, gained);
    return { gained, xp };
  }

  /** Le défi du jour : dix Vrai ou faux tirés avec le jour pour graine, donc les mêmes pour tous ce jour-là. */
  async daily(userId: string) {
    const { day, done } = await this.store.today(userId, this.now());
    const rng = seededRng(day);
    const pool = (await this.store.expressions()).sort((a, b) => a.id - b.id);
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j] as GameExpression, shuffled[i] as GameExpression];
    }
    const questions = shuffled.slice(0, DAILY_QUESTIONS).map((t) => buildTrueFalse(t, pool, rng));
    return { day, done, questions };
  }

  /** Fin du défi : XP des bonnes réponses, plus 20 XP la première fois du jour. */
  async finishDaily(userId: string, correct: number) {
    const { day } = await this.store.today(userId, this.now());
    const bonus = (await this.store.claimChallenge(userId, day)) ? DAILY_BONUS_XP : 0;
    const gained = correct * XP_PER_CORRECT + bonus;
    const xp = await this.store.addXp(userId, gained);
    return { gained, bonus, xp };
  }
}
