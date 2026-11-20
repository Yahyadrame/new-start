import { createEmptyCard, fsrs, Rating, State, type Card } from 'ts-fsrs';

export const GRADES = ['again', 'hard', 'good', 'easy'] as const;
export type Grade = (typeof GRADES)[number];

/** L'état d'une carte tel que la base le garde (colonnes de `ReviewCard`). */
export interface CardState {
  stability: number;
  difficulty: number;
  due: Date;
  reps: number;
  lapses: number;
  /** Dernière révision ; null pour une carte neuve. */
  lastReview: Date | null;
}

const RATINGS = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
} as const;

// Pas d'étape d'apprentissage en minutes : une carte révisée reçoit tout de suite une échéance en jours.
const scheduler = fsrs({ enable_short_term: false, enable_fuzz: false });

/** Une carte neuve, due tout de suite. */
export function newCard(now: Date): CardState {
  const card = createEmptyCard(now);
  return { stability: 0, difficulty: 0, due: card.due, reps: 0, lapses: 0, lastReview: null };
}

const toFsrs = (s: CardState): Card => ({
  due: s.due,
  stability: s.stability,
  difficulty: s.difficulty,
  scheduled_days: 0,
  learning_steps: 0,
  reps: s.reps,
  lapses: s.lapses,
  state: s.reps === 0 ? State.New : State.Review,
  ...(s.lastReview && { last_review: s.lastReview }),
});

/** Calcule la carte après une réponse. */
export function gradeCard(state: CardState, grade: Grade, now: Date): CardState {
  const next = scheduler.next(toFsrs(state), now, RATINGS[grade]).card;
  return {
    stability: next.stability,
    difficulty: next.difficulty,
    due: next.due,
    reps: next.reps,
    lapses: next.lapses,
    lastReview: now,
  };
}
