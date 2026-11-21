import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { PlansService } from '../application/plans.js';
import { PlansController } from './plans.controller.js';

const list = vi.fn().mockResolvedValue([{ code: 'FREE' }]);
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
const auth = { Authorization: 'Bearer tok-u1' };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [PlansController],
    providers: [
      { provide: PlansService, useValue: { list } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());
beforeEach(() => vi.clearAllMocks());

describe('GET /plans', () => {
  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).get('/plans')).status).toBe(401);
  });

  it('rend les offres, sans pays', async () => {
    const res = await request(app.getHttpServer()).get('/plans').set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ code: 'FREE' }]);
    expect(list).toHaveBeenCalledWith(undefined);
  });

  it('passe le pays en majuscules', async () => {
    await request(app.getHttpServer()).get('/plans?country=sn').set(auth);
    expect(list).toHaveBeenCalledWith('SN');
  });

  it('refuse un pays invalide (400)', async () => {
    const res = await request(app.getHttpServer()).get('/plans?country=SEN').set(auth);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(list).not.toHaveBeenCalled();
  });
});
