import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaSessionStore } from './prisma-session.store.js';

function fake() {
  const db = {
    refreshToken: { findUnique: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
  };
  return { db, store: new PrismaSessionStore(db as unknown as PrismaService) };
}

describe('PrismaSessionStore', () => {
  it('cherche un jeton par son hachage', async () => {
    const { db, store } = fake();
    await store.findToken('h');
    expect(db.refreshToken.findUnique.mock.calls[0]?.[0].where).toEqual({ tokenHash: 'h' });
  });
  it("ne révoque un jeton qu'une fois", async () => {
    const { db, store } = fake();
    db.refreshToken.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    expect(await store.revokeToken('t')).toBe(true);
    expect(await store.revokeToken('t')).toBe(false);
    expect(db.refreshToken.updateMany.mock.calls[0]?.[0].where).toEqual({
      id: 't',
      revokedAt: null,
    });
  });
  it('révoque les jetons encore actifs de la famille', async () => {
    const { db, store } = fake();
    await store.revokeFamily('f');
    expect(db.refreshToken.updateMany.mock.calls[0]?.[0].where).toEqual({
      familyId: 'f',
      revokedAt: null,
    });
  });
  it('ajoute un jeton et lit le compte', async () => {
    const { db, store } = fake();
    const row = { userId: 'u', tokenHash: 'h', familyId: 'f', expiresAt: new Date() };
    await store.addToken(row);
    expect(db.refreshToken.create).toHaveBeenCalledWith({ data: row });
    await store.findUserById('u');
    expect(db.user.findUnique.mock.calls[0]?.[0].where).toEqual({ id: 'u' });
  });
});
