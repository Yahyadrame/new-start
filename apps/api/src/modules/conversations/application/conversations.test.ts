import { describe, expect, it, vi } from 'vitest';
import { ConversationsService, type ConversationsStore } from './conversations.js';

function setup(rule: { adultOnly: boolean } | null, birthYear: number | null = 1990) {
  const item = { id: 'c1' } as never;
  const store: ConversationsStore = {
    list: vi.fn().mockResolvedValue([item]),
    birthYear: vi.fn().mockResolvedValue(birthYear),
    agentRule: vi.fn().mockResolvedValue(rule),
    open: vi.fn().mockResolvedValue(item),
  };
  return { item, store, service: new ConversationsService(store, () => 2026) };
}

describe('ConversationsService', () => {
  it('rend les conversations du compte, telles que le stockage les ordonne', async () => {
    const { store, service } = setup(null);
    expect(await service.list('u1')).toEqual([{ id: 'c1' }]);
    expect(store.list).toHaveBeenCalledWith('u1');
  });

  it('ouvre la conversation avec un contact ordinaire sans lire l’âge', async () => {
    const { item, store, service } = setup({ adultOnly: false });
    expect(await service.start('u1', 'jade')).toBe(item);
    expect(store.open).toHaveBeenCalledWith('u1', 'jade');
    expect(store.birthYear).not.toHaveBeenCalled();
  });

  it('répond 404 NOT_FOUND pour un contact inconnu ou éteint', async () => {
    const { store, service } = setup(null);
    await expect(service.start('u1', 'zzz')).rejects.toMatchObject({
      status: 404,
      response: { code: 'NOT_FOUND' },
    });
    expect(store.open).not.toHaveBeenCalled();
  });

  it('répond 403 TOPIC_ADULT_ONLY à un mineur ou sans année de naissance', async () => {
    for (const year of [2012, null]) {
      const { store, service } = setup({ adultOnly: true }, year);
      await expect(service.start('u1', 'maya')).rejects.toMatchObject({
        status: 403,
        response: { code: 'TOPIC_ADULT_ONLY' },
      });
      expect(store.open).not.toHaveBeenCalled();
    }
  });

  it('ouvre une conversation Amour à une personne majeure', async () => {
    const { store, service } = setup({ adultOnly: true }, 1990);
    await service.start('u1', 'maya');
    expect(store.open).toHaveBeenCalledWith('u1', 'maya');
  });
});
