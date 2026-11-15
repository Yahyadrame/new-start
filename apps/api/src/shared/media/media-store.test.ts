import { describe, expect, it } from 'vitest';
import { FakeMediaStore } from './media-store.js';

describe('FakeMediaStore', () => {
  it('garde le fichier et renvoie une URL prévisible', async () => {
    const store = new FakeMediaStore();
    const data = new Uint8Array([1, 2, 3]);
    const stored = await store.upload({ kind: 'audio', key: 'tts/abc', data });
    expect(stored).toEqual({ key: 'tts/abc', url: 'https://media.fake.test/audio/tts/abc' });
    expect(store.files.get('tts/abc')).toBe(data);
  });
  it('supprime le fichier, même absent', async () => {
    const store = new FakeMediaStore();
    await store.upload({ kind: 'image', key: 'a', data: new Uint8Array() });
    await store.delete('a');
    await store.delete('absent');
    expect(store.files.size).toBe(0);
  });
  it('signe un téléversement valable 10 minutes', async () => {
    const store = new FakeMediaStore(() => new Date('2026-11-15T10:00:00Z'));
    const sig = await store.signUpload({ kind: 'image', key: 'avatar/1' });
    expect(sig.fields.key).toBe('avatar/1');
    expect(sig.expiresAt.toISOString()).toBe('2026-11-15T10:10:00.000Z');
  });
});
