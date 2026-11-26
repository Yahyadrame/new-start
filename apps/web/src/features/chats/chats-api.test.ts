import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addToNotebook,
  translateMessage,
  deleteMessage,
  editMessage,
  ChatsError,
  listConversations,
  listMessages,
  markConversationRead,
  reactToMessage,
  searchMessages,
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => Promise.reject(new Error('corps vide')),
      }),
    );
    await expect(sendMessage('tok', 'c1', body)).rejects.toMatchObject({ status: 500 });
  });

  it('garde le code d’erreur de l’API (limite du jour ou limite de débit)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ code: 'USAGE_LIMIT', message: 'x' }),
      }),
    );
    await expect(sendMessage('tok', 'c1', body)).rejects.toMatchObject({
      status: 429,
      code: 'USAGE_LIMIT',
    });
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

describe('translateMessage', () => {
  it('rend la traduction après un POST avec le jeton', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ translationFr: 'Salut !' }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await translateMessage('tok', 'm1')).toBe('Salut !');
    expect(fetchMock).toHaveBeenCalledWith('/api/messages/m1/translate', {
      method: 'POST',
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('lève ChatsError avec le statut quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(translateMessage('tok', 'm1')).rejects.toMatchObject({ status: 503 });
  });
});

describe('searchMessages', () => {
  it('appelle /api/conversations/search avec le texte encodé et rend les résultats', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ items: [{ messageId: 'm1' }] }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchMessages('tok', 'a&b é')).toEqual([{ messageId: 'm1' }]);
    expect(fetchMock).toHaveBeenCalledWith('/api/conversations/search?q=a%26b%20%C3%A9', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('lève ChatsError quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    await expect(searchMessages('tok', 'x')).rejects.toMatchObject({ status: 400 });
  });

  describe('deleteMessage', () => {
    it('envoie un DELETE avec le jeton', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', fetchMock);
      await deleteMessage('tok', 'm1');
      expect(fetchMock).toHaveBeenCalledWith('/api/messages/m1', {
        method: 'DELETE',
        headers: { authorization: 'Bearer tok' },
      });
    });

    it('lève une erreur quand l’API refuse', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
      await expect(deleteMessage('tok', 'm1')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('reactToMessage', () => {
    it('envoie un PUT avec l’émoji, ou null, et rend le message', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'm1' }) });
      vi.stubGlobal('fetch', fetchMock);
      expect(await reactToMessage('tok', 'm1', '👍')).toEqual({ id: 'm1' });
      expect(fetchMock).toHaveBeenCalledWith('/api/messages/m1/reaction', {
        method: 'PUT',
        headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
        body: JSON.stringify({ emoji: '👍' }),
      });
      await reactToMessage('tok', 'm1', null);
      expect(fetchMock.mock.calls[1]?.[1].body).toBe(JSON.stringify({ emoji: null }));
    });

    it('lève une erreur quand l’API refuse', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
      await expect(reactToMessage('tok', 'm1', '👍')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('editMessage', () => {
    it('envoie un PATCH avec le texte et rend le message', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'm1' }) });
      vi.stubGlobal('fetch', fetchMock);
      expect(await editMessage('tok', 'm1', 'Hello')).toEqual({ id: 'm1' });
      expect(fetchMock).toHaveBeenCalledWith('/api/messages/m1', {
        method: 'PATCH',
        headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
        body: JSON.stringify({ text: 'Hello' }),
      });
    });

    it('lève une erreur quand l’API refuse', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
      await expect(editMessage('tok', 'm1', 'x')).rejects.toMatchObject({ status: 404 });
    });
  });
});
