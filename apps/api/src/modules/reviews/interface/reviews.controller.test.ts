import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { ReviewsService } from '../application/reviews.js';
import { ReviewsController } from './reviews.controller.js';

const listDue = vi.fn().mockResolvedValue([{ id: 'c1' }]);
const addMissed = vi.fn().mockResolvedValue({ created: 2 });
const grade = vi.fn().mockResolvedValue({ due: '2026-11-22T12:00:00.000Z' });
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
const auth = { Authorization: 'Bearer tok-u1' };
const CARD = '0198f0a0-0000-7000-8000-000000000001';
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [ReviewsController],
    providers: [
      { provide: ReviewsService, useValue: { listDue, grade, addMissed } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());
beforeEach(() => vi.clearAllMocks());

describe('GET /reviews/due', () => {
  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).get('/reviews/due')).status).toBe(401);
  });

  it('renvoie les cartes échues du compte', async () => {
    const res = await request(app.getHttpServer()).get('/reviews/due').set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'c1' }]);
    expect(listDue).toHaveBeenCalledWith('u1');
  });
});

describe('POST /reviews/:id/grade', () => {
  const post = (id: string, body: unknown) =>
    request(app.getHttpServer())
      .post(`/reviews/${id}/grade`)
      .set(auth)
      .send(body as object);

  it('refuse sans jeton (401)', async () => {
    const res = await request(app.getHttpServer()).post(`/reviews/${CARD}/grade`).send({});
    expect(res.status).toBe(401);
  });

  it('enregistre la réponse et renvoie l’échéance', async () => {
    const res = await post(CARD, { grade: 'good' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ due: '2026-11-22T12:00:00.000Z' });
    expect(grade).toHaveBeenCalledWith('u1', CARD, 'good');
  });

  it.each([
    ['une note inconnue', CARD, { grade: 'perfect' }],
    ['une note absente', CARD, {}],
    ['un identifiant mal formé', 'nope', { grade: 'good' }],
  ])('refuse %s (400)', async (_label, id, body) => {
    const res = await post(id, body);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(grade).not.toHaveBeenCalled();
  });
});

describe('POST /reviews/missed', () => {
  const post = (body: unknown, headers: Record<string, string> = auth) =>
    request(app.getHttpServer())
      .post('/reviews/missed')
      .set(headers)
      .send(body as object);

  it('refuse sans jeton (401)', async () => {
    expect((await post({ expressionIds: [1] }, {})).status).toBe(401);
  });

  it('crée les cartes des expressions ratées (200)', async () => {
    const res = await post({ expressionIds: [1, 2] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ created: 2 });
    expect(addMissed).toHaveBeenCalledWith('u1', [1, 2]);
  });

  it('refuse une liste vide ou mal formée (400)', async () => {
    expect((await post({ expressionIds: [] })).status).toBe(400);
    expect((await post({ expressionIds: ['a'] })).status).toBe(400);
    expect(addMissed).not.toHaveBeenCalled();
  });
});
