import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CheckReadiness } from '../application/check-readiness.js';
import { ENV } from '../../../config/env.js';
import { HEALTH_CHECKS } from '../domain/health-check.js';
import { HealthController } from './health.controller.js';

const TOKEN = 'jeton-de-test-0123456789';

async function makeApp(token?: string): Promise<INestApplication> {
  const module = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      CheckReadiness,
      { provide: HEALTH_CHECKS, useValue: [{ name: 'database', check: async () => {} }] },
      { provide: ENV, useValue: { SENTRY_TEST_TOKEN: token } },
    ],
  }).compile();
  const created = module.createNestApplication();
  await created.init();
  return created;
}

let app: INestApplication;
let appWithToken: INestApplication;
beforeAll(async () => {
  app = await makeApp();
  appWithToken = await makeApp(TOKEN);
});
afterAll(async () => {
  await app.close();
  await appWithToken.close();
});

describe('HealthController', () => {
  it('ready répond 200 avec l’état de chaque dépendance', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', checks: { database: 'up' } });
  });

  describe('sentry-test', () => {
    it('répond 404 quand aucun jeton n’est configuré', async () => {
      const res = await request(app.getHttpServer())
        .get('/health/sentry-test')
        .set('x-sentry-test-token', TOKEN);
      expect(res.status).toBe(404);
    });

    it('répond 404 sans jeton ou avec un mauvais jeton', async () => {
      const server = appWithToken.getHttpServer();
      expect((await request(server).get('/health/sentry-test')).status).toBe(404);
      const bad = await request(server)
        .get('/health/sentry-test')
        .set('x-sentry-test-token', 'x'.repeat(TOKEN.length));
      expect(bad.status).toBe(404);
    });

    it('lève l’erreur volontaire avec le bon jeton', async () => {
      const res = await request(appWithToken.getHttpServer())
        .get('/health/sentry-test')
        .set('x-sentry-test-token', TOKEN);
      expect(res.status).toBe(500);
    });
  });
});
