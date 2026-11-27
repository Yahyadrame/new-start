import { LevelAnswerError } from './send-level-answer';

const headers = (token: string) => ({ authorization: `Bearer ${token}` });

async function check(res: Response) {
  if (res.ok) return res;
  const body = (await res.json().catch(() => null)) as { code?: string } | null;
  throw new LevelAnswerError(res.status, body?.code);
}

/** Envoie l'enregistrement brut ; l'API renvoie le texte transcrit. */
export async function transcribeAnswer(token: string, audio: Blob): Promise<string> {
  const res = await check(
    await fetch('/api/onboarding/level-test/transcribe', {
      method: 'POST',
      headers: { ...headers(token), 'content-type': audio.type.split(';')[0] || 'audio/webm' },
      body: audio,
    }),
  );
  return ((await res.json()) as { text: string }).text;
}
