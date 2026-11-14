import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Base injoignable (port fermé) et pas de Redis : le service vit mais n'est pas prêt.
process.env['DATABASE_URL'] = 'postgresql://u:p@127.0.0.1:1/db';
process.env['LOG_LEVEL'] = 'silent';
delete process.env['REDIS_URL'];
process.env['CORS_ORIGINS'] = 'https://web.example.test,https://web-*-team.example.test';
const { createApp } = await import('../src/app.js');

let app: INestApplication;
beforeAll(async () => {
  app = await createApp();
  await app.init();
});
afterAll(() => app.close());

describe('GET /health', () => {
  it('live répond 200 sans toucher la base', async () => {
    const res = await request(app.getHttpServer()).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('ready répond 503 au format { code, message, details } quand la base est injoignable', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      code: 'NOT_READY',
      details: { checks: { database: 'down' } },
    });
    expect(res.body.details.checks).not.toHaveProperty('redis');
  });
});

describe('CORS', () => {
  it("autorise l'origine du web configurée", async () => {
    const res = await request(app.getHttpServer())
      .get('/health/live')
      .set('Origin', 'https://web.example.test');
    expect(res.headers['access-control-allow-origin']).toBe('https://web.example.test');
  });
  it("autorise une origine d'aperçu qui correspond au motif", async () => {
    const res = await request(app.getHttpServer())
      .get('/health/live')
      .set('Origin', 'https://web-abc123-team.example.test');
    expect(res.headers['access-control-allow-origin']).toBe('https://web-abc123-team.example.test');
  });
  it('ne répond pas aux autres origines', async () => {
    const res = await request(app.getHttpServer())
      .get('/health/live')
      .set('Origin', 'https://autre.example.test');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
