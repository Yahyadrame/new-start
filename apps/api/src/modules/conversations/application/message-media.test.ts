import { describe, expect, it } from 'vitest';
import { FakeMediaStore } from '../../../shared/media/media-store.js';
import { presentMedia } from './message-media.js';

const now = new Date('2026-12-31T12:00:00Z');
const stores = { active: 'r2' as const, stores: { b2: new FakeMediaStore() } };
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);
const voice = {
  kind: 'AUDIO' as const,
  mediaKey: 'audio/u1/a.webm',
  mediaProvider: 'b2',
  mediaSeconds: 12,
  createdAt: daysAgo(1),
  deletedAt: null,
};
const photo = { ...voice, kind: 'IMAGE' as const, mediaKey: 'image/u1/p.jpg', mediaSeconds: null };

describe('presentMedia', () => {
  it('ne rend rien pour un message texte ou sans les colonnes des médias', async () => {
    expect(await presentMedia({ ...voice, kind: 'TEXT' }, stores, now)).toBeUndefined();
    expect(await presentMedia({ createdAt: now, deletedAt: null }, stores, now)).toBeUndefined();
  });

  it('donne une URL d’une heure, lue chez le fournisseur qui détient le fichier', async () => {
    expect(await presentMedia(voice, stores, now)).toEqual({
      kind: 'AUDIO',
      url: 'https://media.fake.test/audio/u1/a.webm?expires=3600',
      seconds: 12,
      expired: false,
    });
    expect(await presentMedia(photo, stores, now)).toEqual({
      kind: 'IMAGE',
      url: 'https://media.fake.test/image/u1/p.jpg?expires=3600',
      seconds: null,
      expired: false,
    });
  });

  it('ne donne plus d’URL pour un vocal de plus de 30 jours, mais garde les photos', async () => {
    const old = { createdAt: daysAgo(31) };
    expect(await presentMedia({ ...voice, ...old }, stores, now)).toMatchObject({
      url: null,
      expired: true,
    });
    const kept = await presentMedia({ ...photo, ...old }, stores, now);
    expect(kept).toMatchObject({ expired: false });
    expect(kept?.url).not.toBeNull();
  });

  it('rend une URL vide si le fournisseur du fichier n’est plus configuré', async () => {
    const media = await presentMedia({ ...photo, mediaProvider: 'r2' }, stores, now);
    expect(media).toEqual({ kind: 'IMAGE', url: null, seconds: null, expired: false });
  });

  it('rend l’onde d’un vocal qui en a une, jamais celle d’une photo', async () => {
    const mediaPeaks = [0, 40, 100];
    const media = await presentMedia({ ...voice, mediaPeaks }, stores, now);
    expect(media?.peaks).toEqual(mediaPeaks);
    expect(await presentMedia({ ...voice, mediaPeaks: [] }, stores, now)).not.toHaveProperty(
      'peaks',
    );
    expect(await presentMedia({ ...photo, mediaPeaks }, stores, now)).not.toHaveProperty('peaks');
  });

  it('ne montre rien d’un message supprimé', async () => {
    expect(await presentMedia({ ...photo, deletedAt: now }, stores, now)).toBeUndefined();
  });
});

describe('presentMedia, fichier repris par un transfert', () => {
  it('compte les 30 jours d’un vocal depuis son rangement, pas depuis le transfert', async () => {
    const copy = { ...voice, createdAt: daysAgo(1), mediaStoredAt: daysAgo(31) };
    expect((await presentMedia(copy, stores, now))?.url).toBeNull();
    const recent = { ...copy, mediaStoredAt: daysAgo(29) };
    expect((await presentMedia(recent, stores, now))?.url).not.toBeNull();
  });
});
