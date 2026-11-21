import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { ProgressService } from '../application/progress.js';
import { ProgressController } from './progress.controller.js';

const summary = vi
  .fn()
  .mockResolvedValue({ xp: 250, level: 3, levelXp: 50, nextLevelXp: 100, streakDays: 6 });
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [ProgressController],
    providers: [
      { provide: ProgressService, useValue: { summary } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());

describe('GET /progress', () => {
  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).get('/progress')).status).toBe(401);
  });

  it('rend le niveau et l’XP de la personne connectée', async () => {
    const res = await request(app.getHttpServer())
      .get('/progress')
      .set({ Authorization: 'Bearer tok-u1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ xp: 250, level: 3, levelXp: 50, nextLevelXp: 100, streakDays: 6 });
    expect(summary).toHaveBeenCalledWith('u1');
  });
});
