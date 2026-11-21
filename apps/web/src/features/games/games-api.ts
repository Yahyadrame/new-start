import type { MatchQuestion, TrueFalseQuestion } from '@newstart/shared';

export class GamesError extends Error {
  constructor(readonly status: number) {
    super(`games ${status}`);
  }
}

async function questions<T>(type: string, token: string, count: number): Promise<T[]> {
  const res = await fetch(`/api/games/${type}/questions?count=${count}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new GamesError(res.status);
  return (await res.json()) as T[];
}

/** Des questions Vrai ou faux ; la réponse est dans la question, l'écran corrige seul. */
export const trueFalseQuestions = (token: string, count = 10) =>
  questions<TrueFalseQuestion>('true-false', token, count);

/** Des tableaux Associer : quatre expressions à relier à leur sens. */
export const matchQuestions = (token: string, count = 3) =>
  questions<MatchQuestion>('match', token, count);

/** Les expressions ratées pendant une partie deviennent des cartes de révision. */
export async function sendMissed(token: string, expressionIds: number[]): Promise<void> {
  if (expressionIds.length === 0) return;
  const res = await fetch('/api/reviews/missed', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ expressionIds }),
  });
  if (!res.ok) throw new GamesError(res.status);
}

/** Le bilan d'une partie : combien de bonnes réponses, et quelles expressions ratées. */
export interface GameOutcome {
  correct: number;
  missedIds: number[];
}

/** Fin de partie : l'XP gagné (5 par bonne réponse), calculé par l'API. */
export async function sendResult(token: string, correct: number): Promise<number> {
  const res = await fetch('/api/games/results', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ correct }),
  });
  if (!res.ok) throw new GamesError(res.status);
  return ((await res.json()) as { gained: number }).gained;
}

/** Série de jours de la personne (lue dans son résumé de progrès). */
export async function fetchStreak(token: string): Promise<number> {
  const res = await fetch('/api/progress', { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new GamesError(res.status);
  return ((await res.json()) as { streakDays: number }).streakDays;
}

export interface DailyChallenge {
  done: boolean;
  questions: TrueFalseQuestion[];
}

/** Le défi du jour : mêmes questions pour tous, et si la personne l'a déjà terminé. */
export async function fetchDaily(token: string): Promise<DailyChallenge> {
  const res = await fetch('/api/games/daily', { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new GamesError(res.status);
  return (await res.json()) as DailyChallenge;
}

/** Fin du défi : l'XP gagné et la part du bonus du jour (0 si déjà pris). */
export async function sendDailyResult(
  token: string,
  correct: number,
): Promise<{ gained: number; bonus: number }> {
  const res = await fetch('/api/games/daily/results', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ correct }),
  });
  if (!res.ok) throw new GamesError(res.status);
  return (await res.json()) as { gained: number; bonus: number };
}
