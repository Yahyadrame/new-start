import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../generated/prisma/client.js';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaOtpStore } from './prisma-otp.store.js';

function fake() {
  const otpCode = {
    count: vi.fn().mockResolvedValue(2),
    create: vi.fn().mockResolvedValue({ id: 'x' }),
    delete: vi.fn().mockResolvedValue({}),
  };
  return { otpCode, store: new PrismaOtpStore({ otpCode } as unknown as PrismaService) };
}

describe('PrismaOtpStore', () => {
  it('compte les codes récents de la destination', async () => {
    const { store, otpCode } = fake();
    const since = new Date('2026-11-15T11:50:00Z');
    expect(await store.countSince('a@test.dev', since)).toBe(2);
    expect(otpCode.count).toHaveBeenCalledWith({
      where: { destination: 'a@test.dev', createdAt: { gt: since } },
    });
  });
  it("crée la ligne et renvoie l'identifiant, sans profil si absent", async () => {
    const { store, otpCode } = fake();
    const row = {
      channel: 'email' as const,
      destination: 'a@test.dev',
      codeHash: 'h',
      expiresAt: new Date(),
      signup: null,
    };
    expect(await store.create(row)).toEqual({ id: 'x' });
    expect(otpCode.create.mock.calls[0]?.[0].data.signup).toBe(Prisma.DbNull);
  });
  it('supprime la ligne demandée', async () => {
    const { store, otpCode } = fake();
    await store.remove('x');
    expect(otpCode.delete).toHaveBeenCalledWith({ where: { id: 'x' } });
  });
});
