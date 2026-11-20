import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExploreError, listAgents, listTopics, startConversation } from './explore-api';

afterEach(() => vi.unstubAllGlobals());
const ok = (body: unknown) => vi.fn().mockResolvedValue({ ok: true, json: async () => body });

describe('explore-api', () => {
  it('lit les thèmes avec le jeton', async () => {
    const fetchMock = ok([{ slug: 'voyage' }]);
    vi.stubGlobal('fetch', fetchMock);
    expect(await listTopics('tok')).toEqual([{ slug: 'voyage' }]);
    expect(fetchMock).toHaveBeenCalledWith('/api/topics', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('passe le thème et la recherche dans la requête, sans filtre vide', async () => {
    const fetchMock = ok([]);
    vi.stubGlobal('fetch', fetchMock);
    await listAgents('tok', { topic: 'voyage', q: 'sam lin' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/agents?topic=voyage&q=sam+lin');
    await listAgents('tok', {});
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/agents?');
  });

  it('démarre la conversation avec le slug du contact', async () => {
    const fetchMock = ok({ id: 'c1' });
    vi.stubGlobal('fetch', fetchMock);
    expect(await startConversation('tok', 'jade')).toEqual({ id: 'c1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/conversations', {
      method: 'POST',
      headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: '{"agentSlug":"jade"}',
    });
  });

  it('lève ExploreError avec le statut quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(startConversation('tok', 'maya')).rejects.toMatchObject({ status: 403 });
    await expect(listTopics('tok')).rejects.toBeInstanceOf(ExploreError);
  });
});
