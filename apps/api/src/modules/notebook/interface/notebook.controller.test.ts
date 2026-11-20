import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { NotebookService } from '../application/notebook.js';
import { NotebookController } from './notebook.controller.js';

const list = vi.fn().mockResolvedValue([{ id: 'n1' }]);
const add = vi.fn().mockResolvedValue({ id: 'n1' });
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
const auth = { Authorization: 'Bearer tok-u1' };
const MESSAGE = '0198f0a0-0000-7000-8000-000000000001';
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [NotebookController],
    providers: [
      { provide: NotebookService, useValue: { list, add } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());
beforeEach(() => vi.clearAllMocks());

describe('GET /notebook', () => {
  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).get('/notebook')).status).toBe(401);
  });

  it('renvoie le carnet du compte', async () => {
    const res = await request(app.getHttpServer()).get('/notebook').set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'n1' }]);
    expect(list).toHaveBeenCalledWith('u1');
  });
});

describe('POST /notebook', () => {
  const post = () => request(app.getHttpServer()).post('/notebook');

  it('refuse sans jeton (401)', async () => {
    expect((await post().send({ messageId: MESSAGE })).status).toBe(401);
    expect(add).not.toHaveBeenCalled();
  });

  it('refuse un corps invalide (400)', async () => {
    expect((await post().set(auth).send({ messageId: 'nope' })).status).toBe(400);
    expect(add).not.toHaveBeenCalled();
  });

  it('garde la correction du message', async () => {
    const res = await post().set(auth).send({ messageId: MESSAGE });
    expect(res.status).toBe(201);
    expect(add).toHaveBeenCalledWith('u1', MESSAGE);
  });
});
