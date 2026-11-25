import { describe, expect, it, vi } from 'vitest';
import { ContactVariantsService, type ContactVariantsStore } from './contact-variants.js';

const store = (found = true): ContactVariantsStore => ({
  list: vi.fn().mockResolvedValue({ jade: { tone: 'neutre' } }),
  set: vi.fn().mockResolvedValue(found),
  clear: vi.fn().mockResolvedValue(undefined),
});

describe('ContactVariantsService', () => {
  it('liste les réglages de la personne', async () => {
    expect(await new ContactVariantsService(store()).list('u')).toEqual({
      jade: { tone: 'neutre' },
    });
  });

  it('enregistre des réglages et les renvoie', async () => {
    const s = store();
    expect(await new ContactVariantsService(s).set('u', 'jade', { difficulty: 'B2' })).toEqual({
      difficulty: 'B2',
    });
    expect(s.set).toHaveBeenCalledWith('u', 'jade', { difficulty: 'B2' });
  });

  it('répond 404 pour un contact inconnu', async () => {
    await expect(
      new ContactVariantsService(store(false)).set('u', 'x', { tone: 'soigne' }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("revient aux réglages d'origine", async () => {
    const s = store();
    await new ContactVariantsService(s).clear('u', 'jade');
    expect(s.clear).toHaveBeenCalledWith('u', 'jade');
  });
});
