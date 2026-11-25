import { describe, expect, it, vi } from 'vitest';

const jwt = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock('jose', async (original) => ({
  ...(await original<typeof import('jose')>()),
  createRemoteJWKSet: vi.fn(() => 'jwks'),
  jwtVerify: jwt.verify,
}));

import type { SignupProfile } from '@newstart/shared';
import { createAccessSigner } from '../domain/tokens.js';
import { createGoogleVerifier, GoogleSignIn, type GoogleVerifier } from './google-sign-in.js';
import type { AccountStore, UserSummary } from './verify-otp.js';

const user: UserSummary = { id: 'u1', firstName: 'Awa', goal: 'WORK', level: 'A1' };
const profile = { firstName: 'Awa', phone: '+221771234567' } as SignupProfile;
const who = { sub: 'g-1', email: 'awa@test.dev' };

function setup(found: Record<string, UserSummary>, taken = false) {
  const store = {
    findUser: vi.fn(async (p: string, s: string) => found[`${p}:${s}`] ?? null),
    createUser: vi.fn(async () => (taken ? null : user)),
    linkIdentity: vi.fn(async () => {}),
    saveRefreshToken: vi.fn(async () => {}),
  } as unknown as AccountStore;
  const verifier: GoogleVerifier = async (t) => (t === 'ok' ? who : null);
  return {
    store,
    run: (v: GoogleVerifier | null = verifier) => new GoogleSignIn(store, createAccessSigner(), v),
  };
}

describe('GoogleSignIn', () => {
  it('ouvre la session d’un compte déjà relié à Google, sans le relier de nouveau', async () => {
    const { store, run } = setup({ 'google:g-1': user });
    const session = await run().execute({ idToken: 'ok' });
    expect(session.user).toEqual(user);
    expect(store.linkIdentity).not.toHaveBeenCalled();
    expect(store.saveRefreshToken).toHaveBeenCalled();
  });

  it('relie Google au compte qui a le même e-mail vérifié', async () => {
    const { store, run } = setup({ 'email:awa@test.dev': user });
    await run().execute({ idToken: 'ok' });
    expect(store.linkIdentity).toHaveBeenCalledWith('u1', 'google', 'g-1');
  });

  it('répond 404 sans compte ni profil d’inscription', async () => {
    const { run } = setup({});
    await expect(run().execute({ idToken: 'ok' })).rejects.toMatchObject({
      status: 404,
      response: { code: 'ACCOUNT_NOT_FOUND' },
    });
  });

  it('crée le compte avec le profil puis le relie à Google', async () => {
    const { store, run } = setup({});
    await run().execute({ idToken: 'ok', signup: profile });
    expect(store.createUser).toHaveBeenCalledWith(profile, 'email', 'awa@test.dev');
    expect(store.linkIdentity).toHaveBeenCalledWith('u1', 'google', 'g-1');
  });

  it('répond 409 quand le numéro est déjà pris', async () => {
    const { run } = setup({}, true);
    await expect(run().execute({ idToken: 'ok', signup: profile })).rejects.toMatchObject({
      status: 409,
    });
  });

  it('répond 401 pour un jeton refusé et 503 sans client Google configuré', async () => {
    const { store, run } = setup({});
    await expect(run().execute({ idToken: 'bad' })).rejects.toMatchObject({ status: 401 });
    await expect(run(null).execute({ idToken: 'ok' })).rejects.toMatchObject({ status: 503 });
    expect(store.findUser).not.toHaveBeenCalled();
  });
});

describe('createGoogleVerifier', () => {
  const verify = createGoogleVerifier('client-1');

  it('rend le sub et l’e-mail en minuscules pour un jeton valable', async () => {
    jwt.verify.mockResolvedValueOnce({
      payload: { sub: 'g-1', email: 'Awa@Test.dev', email_verified: true },
    });
    expect(await verify('t')).toEqual({ sub: 'g-1', email: 'awa@test.dev' });
    expect(jwt.verify).toHaveBeenCalledWith(
      't',
      'jwks',
      expect.objectContaining({ audience: 'client-1' }),
    );
  });

  it('refuse un e-mail non vérifié ou une charge incomplète', async () => {
    jwt.verify.mockResolvedValueOnce({
      payload: { sub: 'g', email: 'a@b.c', email_verified: false },
    });
    expect(await verify('t')).toBeNull();
    jwt.verify.mockResolvedValueOnce({ payload: { email: 'a@b.c', email_verified: true } });
    expect(await verify('t')).toBeNull();
  });

  it('refuse un jeton que jose rejette', async () => {
    jwt.verify.mockRejectedValueOnce(new Error('expired'));
    expect(await verify('t')).toBeNull();
  });
});
