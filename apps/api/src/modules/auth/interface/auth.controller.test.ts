import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { RequestOtp } from '../application/request-otp.js';
import { AuthController } from './auth.controller.js';

const execute = vi.fn().mockResolvedValue({ expiresInSeconds: 300 });
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [{ provide: RequestOtp, useValue: { execute } }],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());

const post = (body: unknown) =>
  request(app.getHttpServer())
    .post('/auth/otp/request')
    .send(body as object);

describe('POST /auth/otp/request', () => {
  it("normalise l'e-mail (minuscules, sans espaces) et répond 200", async () => {
    const res = await post({ channel: 'email', destination: '  Awa@Test.DEV ' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ expiresInSeconds: 300 });
    expect(execute).toHaveBeenLastCalledWith({ channel: 'email', destination: 'awa@test.dev' });
  });
  it('ramène le numéro SMS au format E.164', async () => {
    await post({ channel: 'sms', destination: '77 123 45 67' });
    expect(execute).toHaveBeenLastCalledWith({ channel: 'sms', destination: '+221771234567' });
  });
  it('transmet le profil validé', async () => {
    const signup = {
      firstName: 'Awa',
      phone: '77 123 45 67',
      goal: 'WORK',
      birthYear: 2000,
      acceptTerms: true,
    };
    await post({ channel: 'email', destination: 'a@test.dev', signup });
    expect(execute.mock.lastCall?.[0].signup).toMatchObject({
      phone: '+221771234567',
      smsOptIn: false,
    });
  });
  it.each([
    ['e-mail invalide', { channel: 'email', destination: 'pas-un-mail' }],
    ['canal inconnu', { channel: 'fax', destination: 'a@test.dev' }],
    ['numéro invalide', { channel: 'sms', destination: '12' }],
    ['corps vide', {}],
  ])('répond 400 VALIDATION_FAILED pour %s', async (_nom, body) => {
    execute.mockClear();
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'VALIDATION_FAILED', message: expect.any(String) });
    expect(res.body.details.length).toBeGreaterThan(0);
    expect(execute).not.toHaveBeenCalled();
  });
});
