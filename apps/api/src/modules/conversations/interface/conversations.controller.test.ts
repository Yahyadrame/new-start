import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { ConversationsService } from '../application/conversations.js';
import { ConversationsController } from './conversations.controller.js';

const list = vi.fn().mockResolvedValue([{ id: 'c1' }]);
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [ConversationsController],
    providers: [
      { provide: ConversationsService, useValue: { list } },
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
