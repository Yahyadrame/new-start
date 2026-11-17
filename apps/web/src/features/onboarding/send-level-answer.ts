import type { LevelAnswerBody, LevelResult } from '@newstart/shared';

/** Après une réponse : la question suivante, ou le résultat après la dernière. */
export type LevelStep = { done: false; next: number } | ({ done: true } & LevelResult);

export class LevelAnswerError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
    super(`level-test/answer ${status}`);
  }
}

/** Envoie une réponse du test de niveau ; la dernière renvoie le niveau estimé. */
export async function sendLevelAnswer(
  accessToken: string,
  answer: LevelAnswerBody,
): Promise<LevelStep> {
  const res = await fetch('/api/onboarding/level-test/answer', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(answer),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { code?: string } | null;
    throw new LevelAnswerError(res.status, body?.code);
  }
  return (await res.json()) as LevelStep;
}
