import { afterEach, describe, expect, it, vi } from 'vitest';
import { LevelAnswerError, sendLevelAnswer } from './send-level-answer';

afterEach(() => vi.unstubAllGlobals());
const reply = (init: object) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(init));

describe('sendLevelAnswer', () => {
  it('envoie la réponse avec le jeton et rend la suite', async () => {
    reply({ ok: true, json: async () => ({ done: false, next: 2 }) });
    await expect(sendLevelAnswer('tok', { position: 1, text: 'Hi' })).resolves.toEqual({
      done: false,
      next: 2,
    });
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/onboarding/level-test/answer');
    expect(init.headers).toMatchObject({ authorization: 'Bearer tok' });
    expect(JSON.parse(init.body as string)).toEqual({ position: 1, text: 'Hi' });
  });
  it("lève une erreur avec le statut et le code de l'API", async () => {
    reply({ ok: false, status: 503, json: async () => ({ code: 'AI_UNAVAILABLE' }) });
    const err = await sendLevelAnswer('tok', { position: 5, text: 'x' }).catch((e) => e);
    expect(err).toBeInstanceOf(LevelAnswerError);
    expect(err).toMatchObject({ status: 503, code: 'AI_UNAVAILABLE' });
  });
  it("garde le statut quand l'erreur n'est pas du JSON", async () => {
    reply({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('html');
      },
    });
    await expect(sendLevelAnswer('tok', { position: 1, text: 'x' })).rejects.toMatchObject({
      status: 502,
      code: undefined,
    });
  });
});
