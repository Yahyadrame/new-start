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
    });
    expect(await presentMedia(photo, stores, now)).toEqual({
      kind: 'IMAGE',
      url: 'https://media.fake.test/image/u1/p.jpg?expires=3600',
      seconds: null,
    });
  });

  it('ne donne plus d’URL pour un vocal de plus de 30 jours, mais garde les photos', async () => {
    const old = { createdAt: daysAgo(31) };
    expect((await presentMedia({ ...voice, ...old }, stores, now))?.url).toBeNull();
    expect((await presentMedia({ ...photo, ...old }, stores, now))?.url).not.toBeNull();
  });

  it('rend une URL vide si le fournisseur du fichier n’est plus configuré', async () => {
    const media = await presentMedia({ ...photo, mediaProvider: 'r2' }, stores, now);
    expect(media).toEqual({ kind: 'IMAGE', url: null, seconds: null });
  });

  it('ne montre rien d’un message supprimé', async () => {
    expect(await presentMedia({ ...photo, deletedAt: now }, stores, now)).toBeUndefined();
  });
});
