import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { MeService } from '../application/me.js';
import { MeController } from './me.controller.js';

const get = vi.fn().mockResolvedValue({ id: 'u1', theme: 'SYSTEM' });
const update = vi.fn().mockResolvedValue({ id: 'u1', theme: 'DARK' });
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [MeController],
    providers: [
      { provide: MeService, useValue: { get, update } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());

const auth = { Authorization: 'Bearer tok-u1' };

describe('/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).get('/me')).status).toBe(401);
    expect((await request(app.getHttpServer()).patch('/me').send({ theme: 'DARK' })).status).toBe(
      401,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('GET renvoie le profil du compte du jeton', async () => {
    const res = await request(app.getHttpServer()).get('/me').set(auth);
    expect(res.status).toBe(200);
    expect(get).toHaveBeenCalledWith('u1');
  });

  it('PATCH applique les modifications valides', async () => {
    const res = await request(app.getHttpServer()).patch('/me').set(auth).send({ theme: 'DARK' });
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith('u1', { theme: 'DARK' });
  });

  it('PATCH refuse un corps invalide (400 VALIDATION_FAILED)', async () => {
    for (const body of [{}, { theme: 'PINK' }, { level: 'C2' }]) {
      const res = await request(app.getHttpServer()).patch('/me').set(auth).send(body);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    }
    expect(update).not.toHaveBeenCalled();
  });
});
