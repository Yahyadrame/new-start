import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CheckReadiness } from '../application/check-readiness.js';
import { HEALTH_CHECKS } from '../domain/health-check.js';
import { HealthController } from './health.controller.js';

let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      CheckReadiness,
      { provide: HEALTH_CHECKS, useValue: [{ name: 'database', check: async () => {} }] },
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());

describe('HealthController', () => {
  it('ready répond 200 avec l’état de chaque dépendance', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', checks: { database: 'up' } });
  });
});
