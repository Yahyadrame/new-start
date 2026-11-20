import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { ConversationsService } from '../application/conversations.js';
import { ConversationsController } from './conversations.controller.js';

const list = vi.fn().mockResolvedValue([{ id: 'c1' }]);
const start = vi.fn().mockResolvedValue({ id: 'c2' });
const send = vi.fn();
const messages = vi.fn().mockResolvedValue({ items: [], nextCursor: null });
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [ConversationsController],
    providers: [
      { provide: ConversationsService, useValue: { list, start, messages, send } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
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

  it('répond 400 VALIDATION_FAILED pour un texte vide ou un clientId invalide', async () => {
    for (const body of [{ clientId, text: '  ' }, { clientId: 'abc', text: 'Hi' }, {}]) {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    }
    expect(send).not.toHaveBeenCalled();
  });
});
