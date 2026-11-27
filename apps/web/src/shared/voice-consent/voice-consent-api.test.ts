import { afterEach, describe, expect, it, vi } from 'vitest';
import { getVoiceConsent, setVoiceConsent } from './voice-consent-api';

afterEach(() => vi.unstubAllGlobals());
const reply = (init: object) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(init));
const call = () => vi.mocked(fetch).mock.calls[0] as [string, RequestInit];

describe('voice-consent-api', () => {
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

  it('lève une erreur quand l’API refuse', async () => {
    reply({ ok: false, status: 502 });
    await expect(getVoiceConsent('tok')).rejects.toThrow('502');
    await expect(setVoiceConsent('tok', true)).rejects.toThrow('502');
  });
});
