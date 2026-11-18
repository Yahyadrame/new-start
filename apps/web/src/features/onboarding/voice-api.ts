import { LevelAnswerError } from './send-level-answer';

const headers = (token: string) => ({ authorization: `Bearer ${token}` });

async function check(res: Response) {
  if (res.ok) return res;
  const body = (await res.json().catch(() => null)) as { code?: string } | null;
  throw new LevelAnswerError(res.status, body?.code);
}

export async function getVoiceConsent(token: string): Promise<boolean> {
  const res = await check(
    await fetch('/api/onboarding/voice-consent', { headers: headers(token) }),
  );
  return ((await res.json()) as { accepted: boolean }).accepted;
}

export async function setVoiceConsent(token: string, accepted: boolean): Promise<void> {
  await check(
    await fetch('/api/onboarding/voice-consent', {
      method: 'PUT',
      headers: { ...headers(token), 'content-type': 'application/json' },
      body: JSON.stringify({ accepted }),
    }),
  );
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
