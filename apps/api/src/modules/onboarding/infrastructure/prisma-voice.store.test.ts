import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaVoiceStore } from './prisma-voice.store.js';

function fake() {
  const db = { user: { findUnique: vi.fn(), updateMany: vi.fn() } };
  return { db, store: new PrismaVoiceStore(db as unknown as PrismaService) };
}

describe('PrismaVoiceStore', () => {
  it('lit le consentement : date posée = accepté', async () => {
    const { db, store } = fake();
    db.user.findUnique.mockResolvedValueOnce({ voiceConsentAt: new Date() });
    expect(await store.hasConsent('u')).toBe(true);
    db.user.findUnique.mockResolvedValueOnce({ voiceConsentAt: null });
    expect(await store.hasConsent('u')).toBe(false);
    db.user.findUnique.mockResolvedValueOnce(null);
    expect(await store.hasConsent('u')).toBe(false);
  });

  it('pose la date une seule fois à l’accord', async () => {
    const { db, store } = fake();
    await store.setConsent('u', true);
    const call = db.user.updateMany.mock.calls[0]?.[0];
    expect(call.where).toEqual({ id: 'u', voiceConsentAt: null });
    expect(call.data.voiceConsentAt).toBeInstanceOf(Date);
  });

  it('efface la date au retrait', async () => {
    const { db, store } = fake();
    await store.setConsent('u', false);
    expect(db.user.updateMany.mock.calls[0]?.[0]).toEqual({
      where: { id: 'u', voiceConsentAt: { not: null } },
      data: { voiceConsentAt: null },
    });
  });
});
