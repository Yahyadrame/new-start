import { describe, expect, it, vi } from 'vitest';
import { CatalogService, isAdult, type CatalogStore } from './catalog.js';

function setup(birthYear: number | null | undefined, adultOnlyTopic: boolean | null = null) {
  const store: CatalogStore = {
    birthYear: vi.fn().mockResolvedValue(birthYear),
    topics: vi.fn().mockResolvedValue([]),
    topicAdultOnly: vi.fn().mockResolvedValue(adultOnlyTopic),
    agents: vi.fn().mockResolvedValue([]),
  };
  return { store, service: new CatalogService(store, () => 2026) };
}

describe('isAdult', () => {
  it('ne compte comme majeure que la personne qui l’est à coup sûr', () => {
    expect(isAdult(2007, 2026)).toBe(true);
    expect(isAdult(2008, 2026)).toBe(false);
    expect(isAdult(2012, 2026)).toBe(false);
  });

  it('refuse sans année de naissance', () => {
    expect(isAdult(null, 2026)).toBe(false);
    expect(isAdult(undefined, 2026)).toBe(false);
  });
});

describe('CatalogService', () => {
  it('liste les thèmes avec les thèmes adultes pour une personne majeure', async () => {
    const { store, service } = setup(1990);
    await service.topics('u1');
    expect(store.topics).toHaveBeenCalledWith({ withAdult: true });
  });

  it('les cache à une personne mineure ou sans année de naissance', async () => {
    const { store, service } = setup(null);
    await service.topics('u1');
    expect(store.topics).toHaveBeenCalledWith({ withAdult: false });
  });

  it('transmet le thème et la recherche au stockage', async () => {
    const { store, service } = setup(1990);
    await service.agents('u1', { topic: 'sport', q: 'mar' });
    expect(store.agents).toHaveBeenCalledWith({ withAdult: true, topic: 'sport', q: 'mar' });
  });

  it('répond 403 TOPIC_ADULT_ONLY quand un mineur demande le thème Amour', async () => {
    const { store, service } = setup(2012, true);
    await expect(service.agents('u1', { topic: 'love' })).rejects.toMatchObject({
      status: 403,
      response: { code: 'TOPIC_ADULT_ONLY' },
    });
    expect(store.agents).not.toHaveBeenCalled();
  });

  it('laisse passer un majeur sur ce thème, et un mineur sur un thème ouvert', async () => {
    await setup(1990, true).service.agents('u1', { topic: 'love' });
    const { store, service } = setup(2012, false);
    await service.agents('u1', { topic: 'sport' });
    expect(store.agents).toHaveBeenCalledWith({ withAdult: false, topic: 'sport' });
  });
});
