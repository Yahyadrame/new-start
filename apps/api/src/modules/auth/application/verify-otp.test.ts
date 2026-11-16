import { describe, expect, it } from 'vitest';
import { hashCode } from '../domain/otp.js';
import type { SignupProfile } from '@newstart/shared';
import { createAccessSigner, hashRefreshToken } from '../domain/tokens.js';
import { VerifyOtp, type AccountStore, type UserSummary } from './verify-otp.js';

const KEY = 'cle';
const NOW = new Date('2026-11-15T12:00:00Z');
const MAIL = 'a@test.dev';
const profile: SignupProfile = {
  firstName: 'Awa',
  phone: '+221771234567',
  goal: 'WORK',
  birthYear: 2000,
  acceptTerms: true,
  smsOptIn: false,
  voiceConsent: false,
};

function setup(
  opts: { signup?: SignupProfile | null; existing?: boolean; taken?: boolean; code?: boolean } = {},
) {
  const state = {
    code:
      opts.code === false
        ? null
        : {
            id: 'c1',
            codeHash: hashCode(KEY, MAIL, '123456'),
            attempts: 0,
            signup: opts.signup ?? null,
          },
    consumed: false,
    tokens: [] as { userId: string; tokenHash: string; familyId: string; expiresAt: Date }[],
    created: [] as string[],
  };
  const user: UserSummary = { id: 'u1', firstName: 'Awa', goal: 'WORK', level: 'A1' };
  const store: AccountStore = {
    findActiveCode: async () => state.code,
    addAttempt: async () => {
      if (state.code) state.code.attempts++;
    },
    consumeCode: async () => !state.consumed && (state.consumed = true),
    findUser: async () => (opts.existing ? user : null),
    createUser: async (_p, channel) => {
      state.created.push(channel);
      return opts.taken ? null : user;
    },
    saveRefreshToken: async (row) => {
      state.tokens.push(row);
    },
  };
  return {
    state,
    build: async () => new VerifyOtp(store, createAccessSigner(), KEY, () => NOW),
  };
}
const input = (code: string) => ({ channel: 'email' as const, destination: MAIL, code });

describe('VerifyOtp', () => {
  it('crée le compte avec le profil gardé, et ouvre une session', async () => {
    const { state, build } = setup({ signup: profile });
    const session = await (await build()).execute(input('123456'));
    expect(state.created).toEqual(['email']);
    expect(session.user.id).toBe('u1');
    expect(session.accessToken.split('.')).toHaveLength(3);
    expect(session.expiresInSeconds).toBe(900);
    expect(state.consumed).toBe(true);
  });
  it('ne stocke que le hachage du jeton de rafraîchissement, valable 30 jours', async () => {
    const { state, build } = setup({ existing: true });
    const { refreshToken } = await (await build()).execute(input('123456'));
    expect(state.tokens[0]?.tokenHash).toBe(hashRefreshToken(refreshToken));
    expect(JSON.stringify(state.tokens)).not.toContain(refreshToken);
    expect(state.tokens[0]?.expiresAt.getTime()).toBe(NOW.getTime() + 30 * 86_400_000);
  });
  it('connecte un compte existant sans en créer un autre', async () => {
    const { state, build } = setup({ existing: true, signup: profile });
    await (await build()).execute(input('123456'));
    expect(state.created).toHaveLength(0);
  });
  it('compte un essai à chaque mauvais code', async () => {
    const { state, build } = setup({ existing: true });
    await expect((await build()).execute(input('000000'))).rejects.toMatchObject({
      status: 400,
      response: { code: 'INVALID_CODE' },
    });
    expect(state.code?.attempts).toBe(1);
    expect(state.consumed).toBe(false);
  });
  it('verrouille le code après 5 essais, même avec le bon', async () => {
    const { state, build } = setup({ existing: true });
    const uc = await build();
    for (let i = 0; i < 5; i++) await uc.execute(input('000000')).catch(() => undefined);
    await expect(uc.execute(input('123456'))).rejects.toMatchObject({
      response: { code: 'INVALID_CODE' },
    });
    expect(state.tokens).toHaveLength(0);
  });
  it('répond INVALID_CODE sans code actif (absent ou expiré)', async () => {
    const { build } = setup({ code: false });
    await expect((await build()).execute(input('123456'))).rejects.toMatchObject({
      response: { code: 'INVALID_CODE' },
    });
  });
  it('refuse un code déjà utilisé par un appel concurrent', async () => {
    const { state, build } = setup({ existing: true });
    state.consumed = true;
    await expect((await build()).execute(input('123456'))).rejects.toMatchObject({
      response: { code: 'INVALID_CODE' },
    });
  });
  it("répond 404 sans compte ni profil d'inscription", async () => {
    const { build } = setup();
    await expect((await build()).execute(input('123456'))).rejects.toMatchObject({
      status: 404,
      response: { code: 'ACCOUNT_NOT_FOUND' },
    });
  });
  it("répond 409 si le numéro ou l'adresse est déjà pris", async () => {
    const { build } = setup({ signup: profile, taken: true });
    await expect((await build()).execute(input('123456'))).rejects.toMatchObject({
      status: 409,
      response: { code: 'ACCOUNT_CONFLICT' },
    });
  });
});
