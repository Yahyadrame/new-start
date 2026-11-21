import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { NotificationsService } from '../application/notifications.js';
import { NotificationsController } from './notifications.controller.js';

const items = [
  {
    id: 'n1',
    kind: 'reminder',
    title: 'T',
    body: 'B',
    createdAt: '2026-11-21T19:00:00Z',
    read: false,
  },
];
const list = vi.fn().mockResolvedValue(items);
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [NotificationsController],
    providers: [
      { provide: NotificationsService, useValue: { list } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());

describe('GET /notifications', () => {
  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).get('/notifications')).status).toBe(401);
  });

  it('rend les notifications de la personne connectée', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications')
      .set({ Authorization: 'Bearer tok-u1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(items);
    expect(list).toHaveBeenCalledWith('u1');
  });
});
