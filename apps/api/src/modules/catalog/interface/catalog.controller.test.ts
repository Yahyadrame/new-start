import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { CatalogService } from '../application/catalog.js';
import { CatalogController } from './catalog.controller.js';

const topics = vi.fn().mockResolvedValue([{ slug: 'sport' }]);
const agents = vi.fn().mockResolvedValue([{ slug: 'marcus' }]);
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
const auth = { Authorization: 'Bearer tok-u1' };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [CatalogController],
    providers: [
      { provide: CatalogService, useValue: { topics, agents } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());
beforeEach(() => vi.clearAllMocks());

describe('GET /topics', () => {
  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).get('/topics')).status).toBe(401);
  });

  it('renvoie les thèmes pour le compte du jeton', async () => {
    const res = await request(app.getHttpServer()).get('/topics').set(auth);
    expect(res.body).toEqual([{ slug: 'sport' }]);
    expect(topics).toHaveBeenCalledWith('u1');
  });
});

describe('GET /agents', () => {
  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).get('/agents')).status).toBe(401);
  });

  it('passe le thème et la recherche, sans espaces autour', async () => {
    const res = await request(app.getHttpServer()).get('/agents?topic=sport&q=%20mar%20').set(auth);
    expect(res.body).toEqual([{ slug: 'marcus' }]);
    expect(agents).toHaveBeenCalledWith('u1', { topic: 'sport', q: 'mar' });
  });

  it('répond 400 VALIDATION_FAILED à une recherche vide', async () => {
    const res = await request(app.getHttpServer()).get('/agents?q=%20').set(auth);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(agents).not.toHaveBeenCalled();
  });
});
