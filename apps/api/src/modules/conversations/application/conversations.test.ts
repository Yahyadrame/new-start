import { describe, expect, it, vi } from 'vitest';
import { encodeCursor } from './message-cursor.js';
import { ConversationsService, type ConversationsStore } from './conversations.js';

function setup(rule: { adultOnly: boolean } | null, birthYear: number | null = 1990) {
  const item = { id: 'c1' } as never;
  const store: ConversationsStore = {
    list: vi.fn().mockResolvedValue([item]),
    birthYear: vi.fn().mockResolvedValue(birthYear),
    agentRule: vi.fn().mockResolvedValue(rule),
    open: vi.fn().mockResolvedValue(item),
    messages: vi.fn(),
    send: vi.fn(),
    markRead: vi.fn(),
    deleteMessage: vi.fn(),
    editMessage: vi.fn(),
    search: vi.fn().mockResolvedValue([]),
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

describe('ConversationsService.messages', () => {
  const ID = '0198f0a0-0000-7000-8000-000000000001';
  const row = (n: number) => ({
    id: `m${n}`,
    author: 'AGENT' as const,
    text: `t${n}`,
    translationFr: null,
    createdAt: new Date(Date.UTC(2026, 10, 20, 10, 60 - n)),
    correction: null,
    replyTo: null,
    editedAt: null,
    deletedAt: null,
  });
  const rows = (count: number) => Array.from({ length: count }, (_, i) => row(i + 1));
  const serve = (found: ReturnType<typeof rows> | null) => {
    const { store, service } = setup(null);
    vi.mocked(store.messages).mockResolvedValue(found);
    return { store, service };
  };

  it('rend une page de 30 sans curseur quand il n’y a rien de plus ancien', async () => {
    const { store, service } = serve(rows(3));
    const page = await service.messages('u1', ID);
    expect(page.nextCursor).toBeNull();
    expect(page.items.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    expect(page.items[0]?.createdAt).toBe('2026-11-20T10:59:00.000Z');
    expect(store.messages).toHaveBeenCalledWith('u1', ID, null, 31);
  });

  it('coupe à 30 messages et donne le curseur du dernier message gardé', async () => {
    const { service } = serve(rows(31));
    const page = await service.messages('u1', ID);
    expect(page.items).toHaveLength(30);
    expect(page.nextCursor).toBe(encodeCursor({ createdAt: row(30).createdAt, id: 'm30' }));
  });

  it('passe le curseur décodé au stockage', async () => {
    const { store, service } = serve(rows(1));
    const cursor = { createdAt: new Date('2026-11-20T09:00:00.000Z'), id: 'm9' };
    await service.messages('u1', ID, encodeCursor(cursor));
    expect(store.messages).toHaveBeenCalledWith('u1', ID, cursor, 31);
  });

  it('répond 400 à un curseur invalide, sans interroger le stockage', async () => {
    const { store, service } = serve(rows(1));
    await expect(service.messages('u1', ID, 'zzz')).rejects.toMatchObject({
      status: 400,
      response: { code: 'VALIDATION_FAILED' },
    });
    expect(store.messages).not.toHaveBeenCalled();
  });

  it('répond 404 pour une conversation absente ou d’une autre personne', async () => {
    const { service } = serve(null);
    await expect(service.messages('u1', ID)).rejects.toMatchObject({
      status: 404,
      response: { code: 'NOT_FOUND' },
    });
  });

  it('répond 404 pour un identifiant qui n’est pas un UUID, sans interroger le stockage', async () => {
    const { store, service } = serve(rows(1));
    await expect(service.messages('u1', 'abc')).rejects.toMatchObject({ status: 404 });
    expect(store.messages).not.toHaveBeenCalled();
  });
});

describe('ConversationsService.send', () => {
  const ID = '0198f0a0-0000-7000-8000-000000000001';
  const body = { clientId: '0198f0a0-0000-4000-8000-000000000002', text: 'Hello' };
  const row = {
    id: 'm1',
    author: 'USER' as const,
    text: 'Hello',
    translationFr: null,
    createdAt: new Date('2026-11-20T10:00:00.000Z'),
    correction: null,
    replyTo: null,
    editedAt: null,
    deletedAt: null,
  };

  it('rend le message cité, vide quand il a été supprimé', async () => {
    const { store, service } = setup(null);
    const quoted = { id: 'm0', author: 'AGENT' as const, text: 'Hi', deletedAt: null };
    vi.mocked(store.send).mockResolvedValue({ row: { ...row, replyTo: quoted }, created: true });
    expect((await service.send('u1', ID, body)).message.replyTo).toEqual({
      id: 'm0',
      author: 'AGENT',
      text: 'Hi',
      deleted: false,
    });
    const gone = { ...quoted, text: '', deletedAt: new Date() };
    vi.mocked(store.send).mockResolvedValue({ row: { ...row, replyTo: gone }, created: true });
    expect((await service.send('u1', ID, body)).message.replyTo).toMatchObject({ deleted: true });
  });

  it('rend le message avec sa date en texte et signale la création', async () => {
    const { store, service } = setup(null);
    vi.mocked(store.send).mockResolvedValue({ row, created: true });
    expect(await service.send('u1', ID, body)).toEqual({
      message: {
        id: 'm1',
        author: 'USER',
        text: 'Hello',
        translationFr: null,
        correction: null,
        replyTo: null,
        deleted: false,
        edited: false,
        createdAt: '2026-11-20T10:00:00.000Z',
      },
      created: true,
    });
    expect(store.send).toHaveBeenCalledWith('u1', ID, body, 60);
  });

  it('signale un renvoi quand le clientId était déjà enregistré', async () => {
    const { store, service } = setup(null);
    vi.mocked(store.send).mockResolvedValue({ row, created: false });
    expect((await service.send('u1', ID, body)).created).toBe(false);
  });

  it('répond 404 pour une conversation absente ou d’une autre personne', async () => {
    const { store, service } = setup(null);
    vi.mocked(store.send).mockResolvedValue(null);
    await expect(service.send('u1', ID, body)).rejects.toMatchObject({
      status: 404,
      response: { code: 'NOT_FOUND' },
    });
  });

  it('répond 429 avec un message doux quand la limite du jour est atteinte', async () => {
    const { store } = setup(null);
    const schedule = vi.fn();
    const service = new ConversationsService(store, () => 2026, { schedule }, 5);
    vi.mocked(store.send).mockResolvedValue({ limited: true });
    await expect(service.send('u1', ID, body)).rejects.toMatchObject({
      status: 429,
      response: { code: 'USAGE_LIMIT', message: expect.stringContaining('Reviens demain') },
    });
    expect(store.send).toHaveBeenCalledWith('u1', ID, body, 5);
    expect(schedule).not.toHaveBeenCalled();
  });

  it('répond 404 pour un identifiant qui n’est pas un UUID, sans interroger le stockage', async () => {
    const { store, service } = setup(null);
    await expect(service.send('u1', 'abc', body)).rejects.toMatchObject({ status: 404 });
    expect(store.send).not.toHaveBeenCalled();
  });
  it('lance la réponse de l’agent pour un nouveau message, et pas pour un renvoi', async () => {
    const { store } = setup(null);
    const schedule = vi.fn();
    const service = new ConversationsService(store, () => 2026, { schedule });
    vi.mocked(store.send).mockResolvedValueOnce({ row, created: true });
    await service.send('u1', ID, body);
    expect(schedule).toHaveBeenCalledWith(ID, 'm1');
    vi.mocked(store.send).mockResolvedValueOnce({ row, created: false });
    await service.send('u1', ID, body);
    expect(schedule).toHaveBeenCalledTimes(1);
  });
});

describe('ConversationsService.markRead', () => {
  const ID = '0198f0a0-0000-7000-8000-000000000001';

  it('marque la conversation lue', async () => {
    const { store, service } = setup(null);
    vi.mocked(store.markRead).mockResolvedValue(true);
    await service.markRead('u1', ID);
    expect(store.markRead).toHaveBeenCalledWith('u1', ID);
  });

  it('répond 404 quand la conversation n’est pas à cette personne', async () => {
    const { store, service } = setup(null);
    vi.mocked(store.markRead).mockResolvedValue(false);
    await expect(service.markRead('u1', ID)).rejects.toMatchObject({ status: 404 });
  });

  it('répond 404 sans toucher au stockage quand l’identifiant n’est pas un UUID', async () => {
    const { store, service } = setup(null);
    await expect(service.markRead('u1', 'nope')).rejects.toMatchObject({ status: 404 });
    expect(store.markRead).not.toHaveBeenCalled();
  });
});

describe('ConversationsService.search', () => {
  it('protège le texte cherché, borne la liste et rend des extraits datés en ISO', async () => {
    const { store, service } = setup(null);
    vi.mocked(store.search).mockResolvedValue([
      {
        messageId: 'm1',
        conversationId: 'c1',
        author: 'AGENT',
        text: 'Say 100% hello',
        createdAt: new Date('2026-11-25T10:00:00.000Z'),
        agent: { slug: 'jade', name: 'Jade', initials: 'J' },
      },
    ]);
    const res = await service.search('u1', '100%');
    expect(store.search).toHaveBeenCalledWith('u1', '100\\%', 30);
    expect(res.items).toEqual([
      {
        messageId: 'm1',
        conversationId: 'c1',
        author: 'AGENT',
        excerpt: 'Say 100% hello',
        createdAt: '2026-11-25T10:00:00.000Z',
        agent: { slug: 'jade', name: 'Jade', initials: 'J' },
      },
    ]);
  });

  it('rend une liste vide quand rien ne correspond', async () => {
    const { service } = setup(null);
    expect(await service.search('u1', 'zzz')).toEqual({ items: [] });
  });

  const ID = '11111111-1111-4111-8111-111111111111';

  it('efface le texte d’un message de la personne', async () => {
    const { store, service } = setup(null);
    vi.mocked(store.deleteMessage).mockResolvedValue(true);
    await service.remove('u1', ID);
    expect(store.deleteMessage).toHaveBeenCalledWith('u1', ID);
  });

  it('modifie le texte et relance la correction seule', async () => {
    const { store } = setup(null);
    const schedule = vi.fn();
    const service = new ConversationsService(store, () => 2026, { schedule });
    const row = {
      id: ID,
      author: 'USER',
      text: 'I go home',
      translationFr: null,
      createdAt: new Date('2026-11-25T10:00:00Z'),
      correction: null,
      replyTo: null,
      deletedAt: null,
      editedAt: new Date('2026-11-25T10:05:00Z'),
    };
    vi.mocked(store.editMessage).mockResolvedValue({
      row: row as never,
      conversationId: 'c1',
      changed: true,
    });
    const item = await service.edit('u1', ID, 'I went home');
    expect(item.edited).toBe(true);
    expect(schedule).toHaveBeenCalledWith('c1', ID, { correctionOnly: true });
  });

  it('ne relance rien quand le texte est le même', async () => {
    const { store } = setup(null);
    const schedule = vi.fn();
    const service = new ConversationsService(store, () => 2026, { schedule });
    vi.mocked(store.editMessage).mockResolvedValue({
      row: { id: ID, author: 'USER', text: 'Hi', createdAt: new Date(), editedAt: null } as never,
      conversationId: 'c1',
      changed: false,
    });
    expect((await service.edit('u1', ID, 'Hi')).edited).toBe(false);
    expect(schedule).not.toHaveBeenCalled();
  });

  it('répond 404 pour une modification sur un message inconnu ou un faux identifiant', async () => {
    const { store, service } = setup(null);
    vi.mocked(store.editMessage).mockResolvedValue(null);
    await expect(service.edit('u1', ID, 'x')).rejects.toMatchObject({ status: 404 });
    await expect(service.edit('u1', 'nope', 'x')).rejects.toMatchObject({ status: 404 });
    expect(store.editMessage).toHaveBeenCalledTimes(1);
  });

  it('répond 404 pour un message absent, déjà supprimé ou qui n’est pas à elle', async () => {
    const { store, service } = setup(null);
    vi.mocked(store.deleteMessage).mockResolvedValue(false);
    await expect(service.remove('u1', ID)).rejects.toMatchObject({
      status: 404,
      response: { code: 'NOT_FOUND' },
    });
  });

  it('répond 404 sans interroger la base quand l’identifiant n’est pas un UUID', async () => {
    const { store, service } = setup(null);
    await expect(service.remove('u1', 'zzz')).rejects.toMatchObject({ status: 404 });
    expect(store.deleteMessage).not.toHaveBeenCalled();
  });

  it('marque un message supprimé dans l’historique', async () => {
    const { store, service } = setup(null);
    vi.mocked(store.messages).mockResolvedValue([
      {
        id: 'm1',
        author: 'USER',
        text: '',
        translationFr: null,
        createdAt: new Date('2026-11-25T10:00:00Z'),
        deletedAt: new Date('2026-11-25T11:00:00Z'),
        correction: null,
        replyTo: null,
        editedAt: null,
      },
    ]);
    const page = await service.messages('u1', ID);
    expect(page.items[0]).toMatchObject({ deleted: true, text: '' });
  });
});
