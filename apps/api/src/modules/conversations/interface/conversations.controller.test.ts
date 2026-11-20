import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { ConversationsService } from '../application/conversations.js';
import { ConversationsController } from './conversations.controller.js';

const list = vi.fn().mockResolvedValue([{ id: 'c1' }]);
const start = vi.fn().mockResolvedValue({ id: 'c2' });
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [ConversationsController],
    providers: [
      { provide: ConversationsService, useValue: { list, start } },
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
