const headers = (token: string) => ({ authorization: `Bearer ${token}` });
const URL_PATH = '/api/onboarding/voice-consent';

function check(res: Response) {
  if (!res.ok) throw new Error(`voice-consent ${res.status}`);
  return res;
}

export async function getVoiceConsent(token: string): Promise<boolean> {
  const res = check(await fetch(URL_PATH, { headers: headers(token) }));
  return ((await res.json()) as { accepted: boolean }).accepted;
}

export async function setVoiceConsent(token: string, accepted: boolean): Promise<void> {
  check(
    await fetch(URL_PATH, {
      method: 'PUT',
      headers: { ...headers(token), 'content-type': 'application/json' },
      body: JSON.stringify({ accepted }),
    }),
  );
}
