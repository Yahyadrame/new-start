import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../generated/prisma/client.js';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { SignupProfile } from '@newstart/shared';
import { PrismaAccountStore } from './prisma-account.store.js';

const profile: SignupProfile = {
  firstName: 'Awa',
  phone: '+221771234567',
  goal: 'WORK',
  goals: ['WORK', 'TRAVEL'],
  interests: ['MUSIC'],
  birthYear: 2000,
  acceptTerms: true,
  smsOptIn: true,
  voiceConsent: false,
};

function fake() {
  const db = {
    otpCode: { findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    user: {
      findFirst: vi.fn().mockResolvedValue({ id: 'u' }),
      create: vi.fn().mockResolvedValue({ id: 'u' }),
    },
    refreshToken: { create: vi.fn() },
  };
  return { db, store: new PrismaAccountStore(db as unknown as PrismaService) };
}

describe('PrismaAccountStore', () => {
  it('cherche le dernier code non utilisé et non expiré', async () => {
    const { db, store } = fake();
    db.otpCode.findFirst.mockResolvedValue({ id: 'c', codeHash: 'h', attempts: 1, signup: null });
    const now = new Date();
    expect(await store.findActiveCode('a@test.dev', now)).toEqual({
      id: 'c',
      codeHash: 'h',
      attempts: 1,
      signup: null,
    });
    expect(db.otpCode.findFirst).toHaveBeenCalledWith({
      where: { destination: 'a@test.dev', consumedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    db.otpCode.findFirst.mockResolvedValue(null);
    expect(await store.findActiveCode('a@test.dev', now)).toBeNull();
  });
  it('incrémente les essais', async () => {
    const { db, store } = fake();
    await store.addAttempt('c');
    expect(db.otpCode.update).toHaveBeenCalledWith({
      where: { id: 'c' },
      data: { attempts: { increment: 1 } },
    });
  });
  it("ne consomme un code qu'une fois", async () => {
    const { db, store } = fake();
    db.otpCode.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    expect(await store.consumeCode('c')).toBe(true);
    expect(await store.consumeCode('c')).toBe(false);
  });
  it('trouve le compte par identité', async () => {
    const { db, store } = fake();
    await store.findUser('email', 'a@test.dev');
    expect(db.user.findFirst.mock.calls[0]?.[0].where).toEqual({
      identities: { some: { provider: 'email', subject: 'a@test.dev' } },
    });
  });
  it('crée le compte par e-mail : numéro non vérifié, identité e-mail', async () => {
    const { db, store } = fake();
    await store.createUser(profile, 'email', 'a@test.dev');
    const data = db.user.create.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({
      phoneE164: '+221771234567',
      phoneVerifiedAt: null,
      smsOptIn: true,
      goal: 'WORK',
      goals: ['WORK', 'TRAVEL'],
      interests: ['MUSIC'],
    });
    expect(data.identities.create).toMatchObject({ provider: 'email', subject: 'a@test.dev' });
  });
  it('crée le compte par SMS : numéro vérifié, identité téléphone', async () => {
    const { db, store } = fake();
    await store.createUser(profile, 'sms', '+221771234567');
    const data = db.user.create.mock.calls[0]?.[0].data;
    expect(data.phoneVerifiedAt).toBeInstanceOf(Date);
    expect(data.identities.create.provider).toBe('phone');
  });
  it('renvoie null sur un doublon (P2002) et relance les autres erreurs', async () => {
    const { db, store } = fake();
    db.user.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
    );
    expect(await store.createUser(profile, 'email', 'a@test.dev')).toBeNull();
    db.user.create.mockRejectedValueOnce(new Error('boom'));
    await expect(store.createUser(profile, 'email', 'a@test.dev')).rejects.toThrow('boom');
  });
  it('enregistre le jeton de rafraîchissement', async () => {
    const { db, store } = fake();
    const row = { userId: 'u', tokenHash: 'h', familyId: 'f', expiresAt: new Date() };
    await store.saveRefreshToken(row);
    expect(db.refreshToken.create).toHaveBeenCalledWith({ data: row });
  });
});
