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
