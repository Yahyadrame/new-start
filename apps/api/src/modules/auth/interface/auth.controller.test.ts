import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ENV } from '../../../config/env.js';
import { RequestOtp } from '../application/request-otp.js';
import { VerifyOtp } from '../application/verify-otp.js';
import { AuthController } from './auth.controller.js';

const execute = vi.fn().mockResolvedValue({ expiresInSeconds: 300 });
const verify = vi.fn().mockResolvedValue({
  accessToken: 'jwt',
  expiresInSeconds: 900,
  refreshToken: 'opaque',
  user: { id: 'u1', firstName: 'Awa', goal: 'WORK', level: 'A1' },
});
const env = { NODE_ENV: 'production' };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      { provide: RequestOtp, useValue: { execute } },
      { provide: VerifyOtp, useValue: { execute: verify } },
      { provide: ENV, useValue: env },
    ],
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

describe('POST /auth/otp/verify', () => {
  const send = (body: unknown) =>
    request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send(body as object);

  it('renvoie la session et pose le jeton de rafraîchissement en cookie HttpOnly, hors du corps', async () => {
    const res = await send({ channel: 'email', destination: 'A@Test.dev', code: '123456' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      accessToken: 'jwt',
      expiresInSeconds: 900,
      user: { id: 'u1', firstName: 'Awa', goal: 'WORK', level: 'A1' },
    });
    expect(verify).toHaveBeenLastCalledWith({
      channel: 'email',
      destination: 'a@test.dev',
      code: '123456',
    });
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toContain('ns_refresh=opaque');
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toContain('Path=/auth');
    expect(cookie).toContain('Max-Age=2592000');
  });
  it.each(['12345', 'abcdef', '1234567', ''])('refuse le code %j', async (code) => {
    verify.mockClear();
    const res = await send({ channel: 'email', destination: 'a@test.dev', code });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(verify).not.toHaveBeenCalled();
  });
});
