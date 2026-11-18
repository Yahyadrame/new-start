import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ACCESS_VERIFIER, AccessGuard } from '../../../shared/auth/access.guard.js';
import { LevelTest } from '../application/level-test.js';
import { Voice } from '../application/voice.js';
import { OnboardingController } from './onboarding.controller.js';

const answer = vi.fn().mockResolvedValue({ done: false, next: 2 });
const transcribe = vi.fn().mockResolvedValue({ text: 'hello' });
const consent = vi.fn().mockResolvedValue({ accepted: true });
const setConsent = vi.fn().mockResolvedValue(undefined);
// Faux vérificateur : le jeton « tok-<id> » appartient au compte <id>.
const verifier = { verify: async (t: string) => (t.startsWith('tok-') ? t.slice(4) : null) };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [OnboardingController],
    providers: [
      { provide: LevelTest, useValue: { answer } },
      { provide: Voice, useValue: { transcribe, consent, setConsent } },
      { provide: ACCESS_VERIFIER, useValue: verifier },
      AccessGuard,
    ],
  }).compile();
  app = module.createNestApplication();
  (app as unknown as NestExpressApplication).useBodyParser('raw', {
    type: 'audio/*',
    limit: '1mb',
  });
  await app.init();
});
afterAll(() => app.close());

const send = async (body: unknown, token?: string) => {
  const req = request(app.getHttpServer()).post('/onboarding/level-test/answer');
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send(body as object);
};

describe('POST /onboarding/level-test/answer', () => {
  it('refuse sans jeton (401) sans toucher au test', async () => {
    const res = await send({ position: 1, text: 'hi' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
    expect(answer).not.toHaveBeenCalled();
  });

  it('passe le compte du jeton et la réponse nettoyée au test', async () => {
    const res = await send({ position: 1, text: '  hi  ' }, 'tok-u-1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ done: false, next: 2 });
    expect(answer).toHaveBeenLastCalledWith('u-1', { position: 1, text: 'hi' });
  });

  it('répond 400 VALIDATION_FAILED pour une réponse invalide', async () => {
    const res = await send({ position: 9, text: 'hi' }, 'tok-u-1');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});

describe('voix', () => {
  const auth = { Authorization: 'Bearer tok-u-1' };

  it('transcrit un corps audio brut pour le compte du jeton', async () => {
    const res = await request(app.getHttpServer())
      .post('/onboarding/level-test/transcribe')
      .set(auth)
      .set('Content-Type', 'audio/webm;codecs=opus')
      .send(Buffer.from([1, 2, 3]));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ text: 'hello' });
    const [user, audio, type] = transcribe.mock.calls.at(-1) ?? [];
    expect([user, audio.byteLength, type]).toEqual(['u-1', 3, 'audio/webm']);
  });

  it('passe un enregistrement vide quand le corps n’est pas audio', async () => {
    await request(app.getHttpServer())
      .post('/onboarding/level-test/transcribe')
      .set(auth)
      .send({ a: 1 });
    expect(transcribe.mock.calls.at(-1)?.[1].byteLength).toBe(0);
  });

  it('refuse un enregistrement trop gros (413)', async () => {
    const res = await request(app.getHttpServer())
      .post('/onboarding/level-test/transcribe')
      .set(auth)
      .set('Content-Type', 'audio/webm')
      .send(Buffer.alloc(1024 * 1024 + 1));
    expect(res.status).toBe(413);
  });

  it('lit et écrit le consentement', async () => {
    const got = await request(app.getHttpServer()).get('/onboarding/voice-consent').set(auth);
    expect(got.body).toEqual({ accepted: true });
    const put = await request(app.getHttpServer())
      .put('/onboarding/voice-consent')
      .set(auth)
      .send({ accepted: true });
    expect(put.status).toBe(204);
    expect(setConsent).toHaveBeenCalledWith('u-1', true);
    const bad = await request(app.getHttpServer())
      .put('/onboarding/voice-consent')
      .set(auth)
      .send({ accepted: 'oui' });
    expect(bad.status).toBe(400);
  });
});
