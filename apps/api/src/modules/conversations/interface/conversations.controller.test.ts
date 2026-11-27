import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { useMediaBody } from '../../../shared/http/media-body.js';
import { ConversationsService } from '../application/conversations.js';
import { MediaSend } from '../application/media-send.js';
import { ConversationsController } from './conversations.controller.js';

const list = vi.fn().mockResolvedValue([{ id: 'c1' }]);
const start = vi.fn().mockResolvedValue({ id: 'c2' });
const send = vi.fn();
const sendMedia = vi.fn();
const forward = vi.fn();
const voiceAvailability = vi.fn().mockResolvedValue({ available: false, reason: 'quota' });
const search = vi.fn().mockResolvedValue({ items: [] });
const markRead = vi.fn();
const messages = vi.fn().mockResolvedValue({ items: [], nextCursor: null });
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: NestExpressApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [ConversationsController],
    providers: [
      {
        provide: ConversationsService,
        useValue: { list, start, messages, send, markRead, search },
      },
      { provide: MediaSend, useValue: { send: sendMedia, forward, voiceAvailability } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication<NestExpressApplication>();
  useMediaBody(app);
  await app.init();
});
afterAll(() => app.close());

describe('GET /conversations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).get('/conversations')).status).toBe(401);
    expect(list).not.toHaveBeenCalled();
  });

  it('renvoie les conversations du compte du jeton', async () => {
    const res = await request(app.getHttpServer())
      .get('/conversations')
      .set({ Authorization: 'Bearer tok-u1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'c1' }]);
    expect(list).toHaveBeenCalledWith('u1');
  });
});

describe('POST /conversations', () => {
  beforeEach(() => vi.clearAllMocks());
  const post = () => request(app.getHttpServer()).post('/conversations');

  it('refuse sans jeton (401)', async () => {
    expect((await post().send({ agentSlug: 'jade' })).status).toBe(401);
    expect(start).not.toHaveBeenCalled();
  });

  it('ouvre la conversation avec le contact demandé', async () => {
    const res = await post().set({ Authorization: 'Bearer tok-u1' }).send({ agentSlug: 'jade' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'c2' });
    expect(start).toHaveBeenCalledWith('u1', 'jade');
  });

  it('répond 400 VALIDATION_FAILED sans slug', async () => {
    const res = await post().set({ Authorization: 'Bearer tok-u1' }).send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(start).not.toHaveBeenCalled();
  });
});

describe('GET /conversations/:id/messages', () => {
  beforeEach(() => vi.clearAllMocks());
  const get = (url: string) => request(app.getHttpServer()).get(url);

  it('refuse sans jeton (401)', async () => {
    expect((await get('/conversations/c1/messages')).status).toBe(401);
    expect(messages).not.toHaveBeenCalled();
  });

  it('rend la page de messages du compte, avec le curseur demandé', async () => {
    const res = await get('/conversations/c1/messages?cursor=abc').set({
      Authorization: 'Bearer tok-u1',
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], nextCursor: null });
    expect(messages).toHaveBeenCalledWith('u1', 'c1', 'abc');
  });

  it('répond 400 VALIDATION_FAILED à un curseur vide', async () => {
    const res = await get('/conversations/c1/messages?cursor=').set({
      Authorization: 'Bearer tok-u1',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(messages).not.toHaveBeenCalled();
  });
});

describe('POST /conversations/:id/messages', () => {
  beforeEach(() => vi.clearAllMocks());
  const clientId = '0198f0a0-0000-4000-8000-000000000002';
  const post = (body: unknown, auth = true) => {
    const req = request(app.getHttpServer())
      .post('/conversations/c1/messages')
      .send(body as object);
    return auth ? req.set({ Authorization: 'Bearer tok-u1' }) : req;
  };

  it('refuse sans jeton (401)', async () => {
    expect((await post({ clientId, text: 'Hi' }, false)).status).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });

  it('répond 201 avec le message quand il est nouveau', async () => {
    send.mockResolvedValue({ message: { id: 'm1' }, created: true });
    const res = await post({ clientId, text: '  Hi  ' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'm1' });
    expect(send).toHaveBeenCalledWith('u1', 'c1', { clientId, text: 'Hi' });
  });

  it('répond 200 avec le même message quand le clientId est renvoyé', async () => {
    send.mockResolvedValue({ message: { id: 'm1' }, created: false });
    const res = await post({ clientId, text: 'Hi' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'm1' });
  });

  it('transfère un vocal ou une photo quand `mediaFromId` désigne un message', async () => {
    forward.mockResolvedValue({ message: { id: 'm2' }, created: true });
    const mediaFromId = '0198f0a0-0000-7000-8000-000000000003';
    const res = await post({ clientId, text: '', mediaFromId });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'm2' });
    expect(forward).toHaveBeenCalledWith('u1', 'c1', { clientId, mediaFromId });
    expect(send).not.toHaveBeenCalled();
  });

  it('répond 400 VALIDATION_FAILED pour un texte vide ou un clientId invalide', async () => {
    for (const body of [{ clientId, text: '  ' }, { clientId: 'abc', text: 'Hi' }, {}]) {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    }
    expect(send).not.toHaveBeenCalled();
  });
});

describe('POST /conversations/:id/read', () => {
  beforeEach(() => vi.clearAllMocks());
  const post = () => request(app.getHttpServer()).post('/conversations/c1/read');

  it('refuse sans jeton (401)', async () => {
    expect((await post()).status).toBe(401);
    expect(markRead).not.toHaveBeenCalled();
  });

  it('marque lue la conversation du compte et répond 204', async () => {
    const res = await post().set({ Authorization: 'Bearer tok-u1' });
    expect(res.status).toBe(204);
    expect(markRead).toHaveBeenCalledWith('u1', 'c1');
  });
});

describe('GET /conversations/search', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).get('/conversations/search?q=hello')).status).toBe(
      401,
    );
    expect(search).not.toHaveBeenCalled();
  });

  it('cherche pour le compte du jeton, texte sans espaces autour', async () => {
    const res = await request(app.getHttpServer())
      .get('/conversations/search?q=%20hello%20')
      .set('Authorization', 'Bearer tok-u1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [] });
    expect(search).toHaveBeenCalledWith('u1', 'hello');
  });

  it('refuse un texte trop court, absent ou trop long (400)', async () => {
    for (const q of ['?q=a', '', `?q=${'x'.repeat(101)}`]) {
      const res = await request(app.getHttpServer())
        .get(`/conversations/search${q}`)
        .set('Authorization', 'Bearer tok-u1');
      expect(res.status).toBe(400);
    }
    expect(search).not.toHaveBeenCalled();
  });
});

describe('POST /conversations/:id/media', () => {
  beforeEach(() => vi.clearAllMocks());
  const clientId = '0198f0a0-0000-4000-8000-000000000002';
  const bytes = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 1]);
  const post = (query = `clientId=${clientId}&seconds=4`, type = 'audio/webm') =>
    request(app.getHttpServer())
      .post(`/conversations/c1/media?${query}`)
      .set({ Authorization: 'Bearer tok-u1', 'Content-Type': type })
      .send(bytes);

  it('refuse sans jeton (401)', async () => {
    const res = await request(app.getHttpServer()).post(
      `/conversations/c1/media?clientId=${clientId}`,
    );
    expect(res.status).toBe(401);
    expect(sendMedia).not.toHaveBeenCalled();
  });

  it('transmet les octets et répond 201 avec le nouveau message', async () => {
    sendMedia.mockResolvedValue({ message: { id: 'm1' }, created: true });
    const res = await post();
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'm1' });
    expect(sendMedia).toHaveBeenCalledWith('u1', 'c1', { clientId, data: bytes, seconds: 4 });
  });

  it('répond 200 quand le clientId est renvoyé', async () => {
    sendMedia.mockResolvedValue({ message: { id: 'm1' }, created: false });
    expect((await post()).status).toBe(200);
  });

  it('ne transmet aucun octet pour un autre type de contenu', async () => {
    sendMedia.mockResolvedValue({ message: { id: 'm1' }, created: true });
    await post(`clientId=${clientId}`, 'application/octet-stream');
    expect(sendMedia.mock.calls[0]?.[2].data).toHaveLength(0);
  });

  it('refuse un fichier de plus de 4 Mo (413)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/conversations/c1/media?clientId=${clientId}`)
      .set({ Authorization: 'Bearer tok-u1', 'Content-Type': 'image/jpeg' })
      .send(Buffer.alloc(4 * 1024 * 1024 + 1));
    expect(res.status).toBe(413);
    expect(sendMedia).not.toHaveBeenCalled();
  });

  it('répond 400 VALIDATION_FAILED sans clientId', async () => {
    const res = await post('seconds=4');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(sendMedia).not.toHaveBeenCalled();
  });
});

describe('GET /conversations/voice-availability', () => {
  beforeEach(() => vi.clearAllMocks());
  const get = () => request(app.getHttpServer()).get('/conversations/voice-availability');

  it('refuse sans jeton (401)', async () => {
    expect((await get()).status).toBe(401);
    expect(voiceAvailability).not.toHaveBeenCalled();
  });

  it('dit pourquoi le vocal est indisponible pour le compte du jeton', async () => {
    const res = await get().set({ Authorization: 'Bearer tok-u1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ available: false, reason: 'quota' });
    expect(voiceAvailability).toHaveBeenCalledWith('u1');
  });
});
