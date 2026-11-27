import { describe, expect, it } from 'vitest';
import { FakeLlm, FakeStt, FakeTts } from './fake.js';

describe('FakeLlm', () => {
  it('répond au dernier message en texte', async () => {
    const llm = new FakeLlm();
    const res = await llm.complete({
      system: 's',
      messages: [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
        { role: 'user', content: 'how are you?' },
      ],
    });
    expect(res.text).toBe('Got it: how are you?');
    expect(res.fake).toBe(true);
  });

  it('renvoie le JSON du contrat d’agent quand json est demandé', async () => {
    const res = await new FakeLlm().complete({
      system: 's',
      messages: [{ role: 'user', content: 'hi' }],
      json: true,
    });
    expect(JSON.parse(res.text)).toEqual({ reply: 'Got it: hi', fix: null });
  });

  it('gère une conversation vide', async () => {
    const res = await new FakeLlm().complete({ system: 's', messages: [] });
    expect(res.text).toBe('Got it: ');
  });
});

describe('FakeStt', () => {
  it('transcrit avec des mots horodatés', async () => {
    const res = await new FakeStt().transcribe({
      audio: new Uint8Array(12),
      mimeType: 'audio/webm',
    });
    expect(res.text).toBe('audio of 12 bytes');
    // Marquée factice : l'appelant ne doit pas la prendre pour les paroles de la personne.
    expect(res.fake).toBe(true);
    expect(res.words).toEqual([
      { word: 'audio', start: 0, end: 0.5 },
      { word: 'of', start: 0.5, end: 1 },
      { word: '12', start: 1, end: 1.5 },
      { word: 'bytes', start: 1.5, end: 2 },
    ]);
  });
});

describe('FakeTts', () => {
  it('renvoie le texte encodé comme audio factice', async () => {
    const res = await new FakeTts().synthesize({ text: 'Hello' });
    expect(res.mimeType).toBe('audio/fake');
    expect(new TextDecoder().decode(res.audio)).toBe('Hello');
  });
});
