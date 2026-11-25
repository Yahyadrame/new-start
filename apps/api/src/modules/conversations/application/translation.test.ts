import { describe, expect, it, vi } from 'vitest';
import { TranslationService } from './translation.js';

const ID = '11111111-1111-4111-8111-111111111111';
const noSleep = async () => undefined;

const setup = (
  found: { text: string; translationFr: string | null } | null,
  complete = vi.fn(),
) => {
  const store = {
    find: vi.fn().mockResolvedValue(found),
    save: vi.fn().mockResolvedValue(undefined),
  };
  const llm = { name: 'test', complete };
  return { store, llm, service: new TranslationService(store, llm, noSleep) };
};

describe('TranslationService', () => {
  it('traduit, nettoie et garde la traduction', async () => {
    const complete = vi.fn().mockResolvedValue({ text: '  Salut !\n' });
    const { service, store } = setup({ text: 'Hey!', translationFr: null }, complete);
    expect(await service.translate('u1', ID)).toEqual({ translationFr: 'Salut !' });
    expect(store.find).toHaveBeenCalledWith('u1', ID);
    expect(store.save).toHaveBeenCalledWith(ID, 'Salut !');
    expect(complete.mock.calls[0]?.[0].messages).toEqual([{ role: 'user', content: 'Hey!' }]);
  });

  it('rend la traduction gardée sans rappeler l’IA', async () => {
    const { service, llm, store } = setup({ text: 'Hey!', translationFr: 'Salut !' });
    expect(await service.translate('u1', ID)).toEqual({ translationFr: 'Salut !' });
    expect(llm.complete).not.toHaveBeenCalled();
    expect(store.save).not.toHaveBeenCalled();
  });

  it('répond 404 pour un message absent ou qui n’est pas à cette personne', async () => {
    const { service } = setup(null);
    await expect(service.translate('u1', ID)).rejects.toMatchObject({ status: 404 });
  });

  it('répond 404 sans interroger la base quand l’identifiant n’est pas un UUID', async () => {
    const { service, store } = setup(null);
    await expect(service.translate('u1', 'nope')).rejects.toMatchObject({ status: 404 });
    expect(store.find).not.toHaveBeenCalled();
  });

  it('répond 503 AI_UNAVAILABLE quand l’IA échoue, sans rien garder', async () => {
    const complete = vi.fn().mockRejectedValue(new Error('panne'));
    const { service, store } = setup({ text: 'Hey!', translationFr: null }, complete);
    await expect(service.translate('u1', ID)).rejects.toMatchObject({
      status: 503,
      response: { code: 'AI_UNAVAILABLE' },
    });
    expect(store.save).not.toHaveBeenCalled();
  });

  it('répond 503 quand l’IA renvoie un texte vide', async () => {
    const complete = vi.fn().mockResolvedValue({ text: '   ' });
    const { service } = setup({ text: 'Hey!', translationFr: null }, complete);
    await expect(service.translate('u1', ID)).rejects.toMatchObject({ status: 503 });
  });

  it('refuse la réponse factice de l’IA et ne la garde pas', async () => {
    const complete = vi.fn().mockResolvedValue({ text: 'Got it: Hey!', fake: true });
    const { service, store } = setup({ text: 'Hey!', translationFr: null }, complete);
    await expect(service.translate('u1', ID)).rejects.toMatchObject({
      status: 503,
      response: { code: 'AI_UNAVAILABLE' },
    });
    expect(store.save).not.toHaveBeenCalled();
  });
});
