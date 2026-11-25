import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { ContactAvatarsService } from '../application/contact-avatars.js';
import { ContactAvatarsController } from './contact-avatars.controller.js';

const list = vi.fn().mockResolvedValue({ jade: { id: 'a001' } });
const set = vi.fn().mockImplementation((_u: string, _s: string, c: unknown) => Promise.resolve(c));
const clear = vi.fn().mockResolvedValue(undefined);
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [ContactAvatarsController],
    providers: [
      { provide: ContactAvatarsService, useValue: { list, set, clear } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());
const auth = { Authorization: 'Bearer tok-u1' };

describe('/me/contact-avatars', () => {
  it('demande une connexion', async () => {
    await request(app.getHttpServer()).get('/me/contact-avatars').expect(401);
  });

  it('liste les choix', async () => {
    const res = await request(app.getHttpServer()).get('/me/contact-avatars').set(auth).expect(200);
    expect(res.body).toEqual({ jade: { id: 'a001' } });
    expect(list).toHaveBeenCalledWith('u1');
  });

  it('enregistre un choix valide', async () => {
    await request(app.getHttpServer())
      .put('/me/contact-avatars/jade')
      .set(auth)
      .send({ id: 'a009' })
      .expect(200);
    expect(set).toHaveBeenCalledWith('u1', 'jade', { id: 'a009' });
  });

  it('refuse une silhouette inconnue', async () => {
    await request(app.getHttpServer())
      .put('/me/contact-avatars/jade')
      .set(auth)
      .send({ id: 'a999' })
      .expect(400);
  });

  it("revient à l'original", async () => {
    await request(app.getHttpServer()).delete('/me/contact-avatars/jade').set(auth).expect(204);
    expect(clear).toHaveBeenCalledWith('u1', 'jade');
  });
});
