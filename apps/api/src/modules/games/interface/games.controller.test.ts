import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { GamesService } from '../application/games.js';
import { GamesController } from './games.controller.js';

const questions = vi.fn().mockResolvedValue([{ kind: 'TRUE_FALSE' }]);
const finish = vi.fn().mockResolvedValue({ gained: 15, xp: 40 });
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
const auth = { Authorization: 'Bearer tok-u1' };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [GamesController],
    providers: [
      { provide: GamesService, useValue: { questions, finish } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());
beforeEach(() => vi.clearAllMocks());

const get = (path: string) => request(app.getHttpServer()).get(path).set(auth);

describe('GET /games/:type/questions', () => {
  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).get('/games/match/questions')).status).toBe(401);
  });

  it('prend 10 questions par défaut', async () => {
    const res = await get('/games/true-false/questions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ kind: 'TRUE_FALSE' }]);
    expect(questions).toHaveBeenCalledWith('true-false', 10);
  });

  it('passe le nombre demandé', async () => {
    await get('/games/match/questions?count=5');
    expect(questions).toHaveBeenCalledWith('match', 5);
  });

  it.each([
    '/games/chess/questions',
    '/games/match/questions?count=0',
    '/games/match/questions?count=21',
    '/games/match/questions?count=abc',
  ])('refuse %s (400)', async (path) => {
    const res = await get(path);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(questions).not.toHaveBeenCalled();
  });
});

describe('POST /games/results', () => {
  const post = (body: unknown, headers: Record<string, string> = auth) =>
    request(app.getHttpServer())
      .post('/games/results')
      .set(headers)
      .send(body as object);

  it('refuse sans jeton (401)', async () => {
    expect((await post({ correct: 3 }, {})).status).toBe(401);
  });

  it('rend l’XP gagné (200)', async () => {
    const res = await post({ correct: 3 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ gained: 15, xp: 40 });
    expect(finish).toHaveBeenCalledWith('u1', 3);
  });

  it('refuse un nombre négatif ou trop grand (400)', async () => {
    expect((await post({ correct: -1 })).status).toBe(400);
    expect((await post({ correct: 61 })).status).toBe(400);
    expect(finish).not.toHaveBeenCalled();
  });
});
