import type { SttProvider } from '@newstart/ai';
import { describe, expect, it, vi } from 'vitest';
import { Voice, type VoiceStore } from './voice.js';

function setup(opts: { consent?: boolean; stt?: Partial<SttProvider> } = {}) {
  const store: VoiceStore = {
    hasConsent: vi.fn().mockResolvedValue(opts.consent ?? true),
    setConsent: vi.fn().mockResolvedValue(undefined),
  };
  const stt = {
    name: 'groq',
    transcribe: vi.fn().mockResolvedValue({ text: '  Hello there  ' }),
    ...opts.stt,
  } as SttProvider;
  return { store, stt, voice: new Voice(store, stt) };
}
const audio = new Uint8Array([1, 2, 3]);
const code = async (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e: { getStatus(): number; getResponse(): { code: string } }) => [
      e.getStatus(),
      e.getResponse().code,
    ],
  );

describe('Voice', () => {
  it('transcrit et nettoie le texte', async () => {
    const { voice, stt } = setup();
    expect(await voice.transcribe('u', audio, 'audio/webm')).toEqual({ text: 'Hello there' });
    expect(stt.transcribe).toHaveBeenCalledWith({ audio, mimeType: 'audio/webm' });
  });

  it('refuse sans consentement (403) sans appeler le fournisseur', async () => {
    const { voice, stt } = setup({ consent: false });
    expect(await code(voice.transcribe('u', audio, 'audio/webm'))).toEqual([
      403,
      'VOICE_CONSENT_REQUIRED',
    ]);
    expect(stt.transcribe).not.toHaveBeenCalled();
  });

  it('refuse un enregistrement vide (400)', async () => {
    const { voice } = setup();
    expect(await code(voice.transcribe('u', new Uint8Array(0), 'audio/webm'))).toEqual([
      400,
      'VALIDATION_FAILED',
    ]);
  });

  it("répond 503 quand le fournisseur échoue ou n'est pas branché", async () => {
    const failing = setup({ stt: { transcribe: vi.fn().mockRejectedValue(new Error('x')) } });
    expect(await code(failing.voice.transcribe('u', audio, 'audio/webm'))).toEqual([
      503,
      'AI_UNAVAILABLE',
    ]);
    const fake = setup({ stt: { name: 'fake' } });
    expect(await code(fake.voice.transcribe('u', audio, 'audio/webm'))).toEqual([
      503,
      'AI_UNAVAILABLE',
    ]);
    expect(fake.stt.transcribe).not.toHaveBeenCalled();
  });

  it('refuse un enregistrement de plus de 1 Mo (413) sans appeler le fournisseur', async () => {
    const { voice, stt } = setup();
    const big = new Uint8Array(1024 * 1024 + 1);
    expect(await code(voice.transcribe('u', big, 'audio/webm'))).toEqual([
      413,
      'VALIDATION_FAILED',
    ]);
    expect(stt.transcribe).not.toHaveBeenCalled();
  });

  it('lit et écrit le consentement', async () => {
    const { voice, store } = setup({ consent: false });
    expect(await voice.consent('u')).toEqual({ accepted: false });
    await voice.setConsent('u', true);
    expect(store.setConsent).toHaveBeenCalledWith('u', true);
  });
});
