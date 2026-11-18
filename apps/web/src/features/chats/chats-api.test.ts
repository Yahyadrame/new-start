import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatsError, listConversations } from './chats-api';

afterEach(() => vi.unstubAllGlobals());

describe('listConversations', () => {
  it('appelle /api/conversations avec le jeton et rend la liste', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 'c1' }] });
    vi.stubGlobal('fetch', fetchMock);
    expect(await listConversations('tok')).toEqual([{ id: 'c1' }]);
    expect(fetchMock).toHaveBeenCalledWith('/api/conversations', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('lève ChatsError avec le statut quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(listConversations('tok')).rejects.toMatchObject({ status: 401 });
    await expect(listConversations('tok')).rejects.toBeInstanceOf(ChatsError);
  });
});
