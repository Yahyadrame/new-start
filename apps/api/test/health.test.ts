import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

process.env['LOG_LEVEL'] = 'silent';
const { createApp } = await import('../src/app.js');

let app: INestApplication;
beforeAll(async () => {
  app = await createApp();
  await app.init();
});
afterAll(() => app.close());

describe('GET /health/live', () => {
  it('répond 200', async () => {
    const res = await request(app.getHttpServer()).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
