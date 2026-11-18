import { afterEach, describe, expect, it, vi } from 'vitest';
import { LevelAnswerError } from './send-level-answer';
import { getVoiceConsent, setVoiceConsent, transcribeAnswer } from './voice-api';

afterEach(() => vi.unstubAllGlobals());
const reply = (init: object) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(init));
const call = () => vi.mocked(fetch).mock.calls[0] as [string, RequestInit];

describe('voice-api', () => {
  it('lit le consentement avec le jeton', async () => {
    reply({ ok: true, json: async () => ({ accepted: true }) });
    expect(await getVoiceConsent('tok')).toBe(true);
    expect(call()[0]).toBe('/api/onboarding/voice-consent');
    expect(call()[1].headers).toMatchObject({ authorization: 'Bearer tok' });
  });

  it('enregistre le consentement', async () => {
    reply({ ok: true });
    await setVoiceConsent('tok', true);
    expect(call()[1].method).toBe('PUT');
    expect(JSON.parse(call()[1].body as string)).toEqual({ accepted: true });
  });

  it("envoie l'audio brut sans ses paramètres de codec et rend le texte", async () => {
    reply({ ok: true, json: async () => ({ text: 'hello' }) });
    const audio = new Blob(['x'], { type: 'audio/webm;codecs=opus' });
    expect(await transcribeAnswer('tok', audio)).toBe('hello');
    expect(call()[0]).toBe('/api/onboarding/level-test/transcribe');
    expect(call()[1].headers).toMatchObject({ 'content-type': 'audio/webm' });
    expect(call()[1].body).toBe(audio);
  });

  it('utilise audio/webm quand le type est vide', async () => {
    reply({ ok: true, json: async () => ({ text: '' }) });
    await transcribeAnswer('tok', new Blob(['x']));
    expect(call()[1].headers).toMatchObject({ 'content-type': 'audio/webm' });
  });

  it('lève une erreur avec le statut et le code', async () => {
    reply({ ok: false, status: 403, json: async () => ({ code: 'VOICE_CONSENT_REQUIRED' }) });
    const err = await transcribeAnswer('tok', new Blob(['x'])).catch((e) => e);
    expect(err).toBeInstanceOf(LevelAnswerError);
    expect(err).toMatchObject({ status: 403, code: 'VOICE_CONSENT_REQUIRED' });
  });

  it("garde le statut quand l'erreur n'est pas du JSON", async () => {
    reply({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('html');
      },
    });
    expect(await getVoiceConsent('tok').catch((e) => e)).toMatchObject({ status: 502 });
  });
});
