import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { ContactVariantsService } from '../application/contact-variants.js';
import { ContactVariantsController } from './contact-variants.controller.js';

const list = vi.fn().mockResolvedValue({ jade: { tone: 'neutre' } });
const set = vi.fn().mockImplementation((_u: string, _s: string, v: unknown) => Promise.resolve(v));
const clear = vi.fn().mockResolvedValue(undefined);
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [ContactVariantsController],
    providers: [
      { provide: ContactVariantsService, useValue: { list, set, clear } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());
const auth = { Authorization: 'Bearer tok-u1' };

describe('/me/contact-variants', () => {
  it('demande une connexion', async () => {
    await request(app.getHttpServer()).get('/me/contact-variants').expect(401);
  });

  it('liste les réglages', async () => {
    const res = await request(app.getHttpServer())
      .get('/me/contact-variants')
      .set(auth)
      .expect(200);
    expect(res.body).toEqual({ jade: { tone: 'neutre' } });
    expect(list).toHaveBeenCalledWith('u1');
  });

  it('enregistre des réglages valides', async () => {
    await request(app.getHttpServer())
      .put('/me/contact-variants/jade')
      .set(auth)
      .send({ tone: 'soigne', difficulty: 'B2' })
      .expect(200);
    expect(set).toHaveBeenCalledWith('u1', 'jade', { tone: 'soigne', difficulty: 'B2' });
  });

  it('refuse un ton inconnu ou un corps vide', async () => {
    for (const body of [{ tone: 'grossier' }, {}]) {
      await request(app.getHttpServer())
        .put('/me/contact-variants/jade')
        .set(auth)
        .send(body)
        .expect(400);
    }
  });

  it("revient à l'origine", async () => {
    await request(app.getHttpServer()).delete('/me/contact-variants/jade').set(auth).expect(204);
    expect(clear).toHaveBeenCalledWith('u1', 'jade');
  });
});
