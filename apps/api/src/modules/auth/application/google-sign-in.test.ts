import { describe, expect, it, vi } from 'vitest';
import type { SignupProfile } from '@newstart/shared';
import { createAccessSigner } from '../domain/tokens.js';
import { GoogleSignIn, type GoogleVerifier } from './google-sign-in.js';
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
