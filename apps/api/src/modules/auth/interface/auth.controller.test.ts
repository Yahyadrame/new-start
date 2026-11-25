import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ENV } from '../../../config/env.js';
import { RequestOtp } from '../application/request-otp.js';
import { SessionService } from '../application/session.js';
import { GoogleSignIn } from '../application/google-sign-in.js';
import { VerifyOtp } from '../application/verify-otp.js';
import { AuthController, readCookie } from './auth.controller.js';

const execute = vi.fn().mockResolvedValue({ expiresInSeconds: 300 });
const verify = vi.fn().mockResolvedValue({
  accessToken: 'jwt',
  expiresInSeconds: 900,
  refreshToken: 'opaque',
  user: { id: 'u1', firstName: 'Awa', goal: 'WORK', level: 'A1' },
});
const google = vi.fn().mockResolvedValue({
  accessToken: 'jwt-g',
  expiresInSeconds: 900,
  refreshToken: 'opaque-g',
  user: { id: 'u1' },
});
const sessions = {
  refresh: vi.fn().mockResolvedValue({
    accessToken: 'jwt2',
    expiresInSeconds: 900,
    refreshToken: 'opaque2',
    user: { id: 'u1' },
  }),
  logout: vi.fn().mockResolvedValue(undefined),
};
const env = { NODE_ENV: 'production' };
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      { provide: RequestOtp, useValue: { execute } },
      { provide: VerifyOtp, useValue: { execute: verify } },
      { provide: GoogleSignIn, useValue: { execute: google } },
      { provide: SessionService, useValue: sessions },
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
    expect(cookie).toContain('Path=/api/auth');
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

describe('POST /auth/google', () => {
  const send = (body: unknown) =>
    request(app.getHttpServer())
      .post('/auth/google')
      .send(body as object);
  const idToken = 'x'.repeat(40);

  it('renvoie la session et pose le cookie de rafraîchissement', async () => {
    const res = await send({ idToken });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ accessToken: 'jwt-g', expiresInSeconds: 900, user: { id: 'u1' } });
    expect(String(res.headers['set-cookie'])).toContain('ns_refresh=opaque-g');
    expect(google).toHaveBeenLastCalledWith({ idToken });
  });

  it('refuse un jeton absent ou trop court', async () => {
    google.mockClear();
    expect((await send({ idToken: 'court' })).status).toBe(400);
    expect((await send({})).status).toBe(400);
    expect(google).not.toHaveBeenCalled();
  });
});

describe('POST /auth/refresh et /auth/logout', () => {
  const call = (path: string, cookie?: string) => {
    const r = request(app.getHttpServer()).post(path);
    return cookie ? r.set('Cookie', cookie) : r;
  };

  it('renouvelle la session depuis le cookie et en pose un nouveau', async () => {
    const res = await call('/auth/refresh', 'autre=1; ns_refresh=opaque; x=2');
    expect(res.status).toBe(200);
    expect(sessions.refresh).toHaveBeenLastCalledWith('opaque');
    expect(res.body).toEqual({ accessToken: 'jwt2', expiresInSeconds: 900, user: { id: 'u1' } });
    expect(String(res.headers['set-cookie'])).toContain('ns_refresh=opaque2');
  });
  it('répond 401 sans cookie', async () => {
    sessions.refresh.mockClear();
    const res = await call('/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_REFRESH_TOKEN');
    expect(sessions.refresh).not.toHaveBeenCalled();
  });
  it('déconnecte : révoque et efface le cookie', async () => {
    const res = await call('/auth/logout', 'ns_refresh=opaque');
    expect(res.status).toBe(204);
    expect(sessions.logout).toHaveBeenLastCalledWith('opaque');
    expect(String(res.headers['set-cookie'])).toMatch(/ns_refresh=;.*Path=\/api\/auth/);
  });
  it("déconnecte sans erreur quand il n'y a pas de cookie", async () => {
    sessions.logout.mockClear();
    expect((await call('/auth/logout')).status).toBe(204);
    expect(sessions.logout).not.toHaveBeenCalled();
  });
});

describe('readCookie', () => {
  it('trouve, décode ou ignore', () => {
    expect(readCookie('a=1; b=x%20y', 'b')).toBe('x y');
    expect(readCookie('a=1', 'b')).toBeUndefined();
    expect(readCookie(undefined, 'b')).toBeUndefined();
  });
});
