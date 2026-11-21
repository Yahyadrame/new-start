import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { TranslationService } from '../application/translation.js';
import { MessagesController } from './messages.controller.js';

const translate = vi.fn().mockResolvedValue({ translationFr: 'Salut !' });
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [MessagesController],
    providers: [
      { provide: TranslationService, useValue: { translate } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());

describe('POST /messages/:id/translate', () => {
  it('refuse sans jeton (401)', async () => {
    expect((await request(app.getHttpServer()).post('/messages/m1/translate')).status).toBe(401);
    expect(translate).not.toHaveBeenCalled();
  });

  it('rend la traduction pour la personne connectée (200)', async () => {
    const res = await request(app.getHttpServer())
      .post('/messages/m1/translate')
      .set({ Authorization: 'Bearer tok-u1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ translationFr: 'Salut !' });
    expect(translate).toHaveBeenCalledWith('u1', 'm1');
  });
});
