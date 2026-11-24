import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { PushSubscriptionsService } from '../application/push-subscriptions.js';
import { PushSubscriptionsController } from './push-subscriptions.controller.js';

const subscribe = vi.fn().mockResolvedValue(undefined);
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
const body = { endpoint: 'https://push.test/a', keys: { p256dh: 'k', auth: 'a' } };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [PushSubscriptionsController],
    providers: [
      { provide: PushSubscriptionsService, useValue: { subscribe } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());

describe('POST /push/subscriptions', () => {
  it('refuse sans jeton (401)', async () => {
    const res = await request(app.getHttpServer()).post('/push/subscriptions').send(body);
    expect(res.status).toBe(401);
  });

  it('enregistre l’abonnement de la personne connectée (204)', async () => {
    const res = await request(app.getHttpServer())
      .post('/push/subscriptions')
      .set({ Authorization: 'Bearer tok-u1' })
      .send(body);
    expect(res.status).toBe(204);
    expect(subscribe).toHaveBeenCalledWith('u1', body);
  });

  it('refuse un abonnement mal formé (400) sans rien enregistrer', async () => {
    subscribe.mockClear();
    const res = await request(app.getHttpServer())
      .post('/push/subscriptions')
      .set({ Authorization: 'Bearer tok-u1' })
      .send({ endpoint: 'http://push.test/a', keys: {} });
    expect(res.status).toBe(400);
    expect(subscribe).not.toHaveBeenCalled();
  });
});
