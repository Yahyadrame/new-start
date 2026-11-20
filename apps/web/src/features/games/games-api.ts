import type { TrueFalseQuestion } from '@newstart/shared';

export class GamesError extends Error {
  constructor(readonly status: number) {
    super(`games ${status}`);
  }
}

/** Des questions Vrai ou faux ; la réponse est dans la question, l'écran corrige seul. */
export async function trueFalseQuestions(token: string, count = 10): Promise<TrueFalseQuestion[]> {
  const res = await fetch(`/api/games/true-false/questions?count=${count}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new GamesError(res.status);
  return (await res.json()) as TrueFalseQuestion[];
}
