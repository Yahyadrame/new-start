import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaContactAvatarsStore } from './prisma-contact-avatars.store.js';

function fake() {
  const db = {
    contactAvatar: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    agent: { findUnique: vi.fn() },
  };
  return { db, store: new PrismaContactAvatarsStore(db as unknown as PrismaService) };
}

describe('PrismaContactAvatarsStore', () => {
  it('range les choix par contact et ignore une ligne abîmée', async () => {
    const { db, store } = fake();
    db.contactAvatar.findMany.mockResolvedValue([
      { avatar: { id: 'a005', variant: 'noir' }, agent: { slug: 'jade' } },
      { avatar: { id: 'zzz' }, agent: { slug: 'sam' } },
    ]);
    expect(await store.list('u')).toEqual({ jade: { id: 'a005', variant: 'noir' } });
    expect(db.contactAvatar.findMany.mock.calls[0]?.[0].where).toEqual({ userId: 'u' });
  });

  it('enregistre ou remplace le choix pour le contact', async () => {
    const { db, store } = fake();
    db.agent.findUnique.mockResolvedValue({ id: 'ag' });
    expect(await store.set('u', 'jade', { id: 'a003' })).toBe(true);
    const call = db.contactAvatar.upsert.mock.calls[0]?.[0];
    expect(call.where).toEqual({ userId_agentId: { userId: 'u', agentId: 'ag' } });
    expect(call.create.avatar).toEqual({ id: 'a003' });
    expect(call.update.avatar).toEqual({ id: 'a003' });
  });

  it("ne crée rien pour un contact qui n'existe pas", async () => {
    const { db, store } = fake();
    db.agent.findUnique.mockResolvedValue(null);
    expect(await store.set('u', 'x', { id: 'a003' })).toBe(false);
    expect(db.contactAvatar.upsert).not.toHaveBeenCalled();
  });

  it('retire le choix', async () => {
    const { db, store } = fake();
    await store.clear('u', 'jade');
    expect(db.contactAvatar.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u', agent: { slug: 'jade' } },
    });
  });
});
