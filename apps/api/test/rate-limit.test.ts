import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

process.env['DATABASE_URL'] = 'postgresql://u:p@127.0.0.1:1/db';
process.env['LOG_LEVEL'] = 'silent';
delete process.env['REDIS_URL'];
process.env['RATE_LIMIT_PER_MINUTE'] = '2';
const { createApp } = await import('../src/app.js');

let app: INestApplication;
beforeAll(async () => {
  app = await createApp();
  await app.init();
});
afterAll(() => app.close());

describe('limite de débit', () => {
  it('répond 429 RATE_LIMITED après la limite, sauf pour les sondes /health', async () => {
    const http = app.getHttpServer();
    await request(http).get('/inconnu');
    await request(http).get('/inconnu');
    const res = await request(http).get('/inconnu');
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('RATE_LIMITED');
    expect(res.headers['retry-after']).toBeDefined();
    expect((await request(http).get('/health/live')).status).toBe(200);
  });
});
