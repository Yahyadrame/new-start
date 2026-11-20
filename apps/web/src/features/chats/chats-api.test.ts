import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addToNotebook,
  ChatsError,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from './chats-api';

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

describe('listMessages', () => {
  const page = { items: [], nextCursor: null };

  it('lit la première page sans curseur', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => page });
    vi.stubGlobal('fetch', fetchMock);
    expect(await listMessages('tok', 'c1')).toEqual(page);
    expect(fetchMock).toHaveBeenCalledWith('/api/conversations/c1/messages', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('passe le curseur encodé pour les messages plus anciens', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => page });
    vi.stubGlobal('fetch', fetchMock);
    await listMessages('tok', 'c1', 'a+b/c=');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/conversations/c1/messages?cursor=a%2Bb%2Fc%3D');
  });

  it('lève ChatsError avec le statut quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(listMessages('tok', 'c1')).rejects.toMatchObject({ status: 404 });
  });
});

describe('sendMessage', () => {
  const body = { clientId: '0198f0a0-0000-4000-8000-000000000002', text: 'Hello' };

  it('envoie le message en POST avec le jeton et rend le message enregistré', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'm1' }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendMessage('tok', 'c1', body)).toEqual({ id: 'm1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/conversations/c1/messages', {
      method: 'POST',
      headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  });

  it('lève ChatsError avec le statut quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(sendMessage('tok', 'c1', body)).rejects.toMatchObject({ status: 429 });
  });
});

describe('markConversationRead', () => {
  it('appelle /read en POST avec le jeton', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await markConversationRead('tok', 'c1');
    expect(fetchMock).toHaveBeenCalledWith('/api/conversations/c1/read', {
      method: 'POST',
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('lève ChatsError avec le statut quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(markConversationRead('tok', 'c1')).rejects.toMatchObject({ status: 404 });
  });
});

describe('addToNotebook', () => {
  it('envoie le messageId en POST avec le jeton', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await addToNotebook('tok', 'm1');
    expect(fetchMock).toHaveBeenCalledWith('/api/notebook', {
      method: 'POST',
      headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: JSON.stringify({ messageId: 'm1' }),
    });
  });

  it('lève ChatsError avec le statut quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(addToNotebook('tok', 'm1')).rejects.toMatchObject({ status: 404 });
  });
});
