import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { LevelTest } from '../application/level-test.js';
import { OnboardingController } from './onboarding.controller.js';

const answer = vi.fn().mockResolvedValue({ done: false, next: 2 });
// Faux vérificateur : le jeton « tok-<id> » appartient au compte <id>.
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [OnboardingController],
    providers: [
      { provide: LevelTest, useValue: { answer } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());

const send = async (body: unknown, token?: string) => {
  const req = request(app.getHttpServer()).post('/onboarding/level-test/answer');
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send(body as object);
};

describe('POST /onboarding/level-test/answer', () => {
  it('refuse sans jeton (401) sans toucher au test', async () => {
    const res = await send({ position: 1, text: 'hi' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
    expect(answer).not.toHaveBeenCalled();
  });

  it('passe le compte du jeton et la réponse nettoyée au test', async () => {
    const res = await send({ position: 1, text: '  hi  ' }, 'tok-u-1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ done: false, next: 2 });
    expect(answer).toHaveBeenLastCalledWith('u-1', { position: 1, text: 'hi' });
  });

  it('répond 400 VALIDATION_FAILED pour une réponse invalide', async () => {
    const res = await send({ position: 9, text: 'hi' }, 'tok-u-1');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});
