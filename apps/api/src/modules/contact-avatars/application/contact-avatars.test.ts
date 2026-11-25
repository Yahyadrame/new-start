import { describe, expect, it, vi } from 'vitest';
import { ContactAvatarsService, type ContactAvatarsStore } from './contact-avatars.js';

const store = (found = true): ContactAvatarsStore => ({
  list: vi.fn().mockResolvedValue({ jade: { id: 'a001' } }),
  set: vi.fn().mockResolvedValue(found),
  clear: vi.fn().mockResolvedValue(undefined),
});

describe('ContactAvatarsService', () => {
  it('liste les choix de la personne', async () => {
    expect(await new ContactAvatarsService(store()).list('u')).toEqual({ jade: { id: 'a001' } });
  });

  it('enregistre un choix et le renvoie', async () => {
    const s = store();
    expect(await new ContactAvatarsService(s).set('u', 'jade', { id: 'a002' })).toEqual({
      id: 'a002',
    });
    expect(s.set).toHaveBeenCalledWith('u', 'jade', { id: 'a002' });
  });

  it('répond 404 pour un contact inconnu', async () => {
    await expect(
      new ContactAvatarsService(store(false)).set('u', 'x', { id: 'a002' }),
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  it("revient à la silhouette d'origine", async () => {
    const s = store();
    await new ContactAvatarsService(s).clear('u', 'jade');
    expect(s.clear).toHaveBeenCalledWith('u', 'jade');
  });
});
