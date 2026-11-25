import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaContactVariantsStore } from './prisma-contact-variants.store.js';

function fake() {
  const db = {
    contactVariant: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    agent: { findUnique: vi.fn() },
  };
  return { db, store: new PrismaContactVariantsStore(db as unknown as PrismaService) };
}

describe('PrismaContactVariantsStore', () => {
  it('range les réglages par contact et ignore une ligne abîmée', async () => {
    const { db, store } = fake();
    db.contactVariant.findMany.mockResolvedValue([
      { tone: 'soigne', difficulty: null, agent: { slug: 'jade' } },
      { tone: null, difficulty: 'C2', agent: { slug: 'sam' } },
      { tone: null, difficulty: null, agent: { slug: 'leo' } },
    ]);
    expect(await store.list('u')).toEqual({ jade: { tone: 'soigne' } });
    expect(db.contactVariant.findMany.mock.calls[0]?.[0].where).toEqual({ userId: 'u' });
  });

  it('enregistre ou remplace les réglages du contact', async () => {
    const { db, store } = fake();
    db.agent.findUnique.mockResolvedValue({ id: 'ag' });
    expect(await store.set('u', 'jade', { difficulty: 'B2' })).toBe(true);
    const call = db.contactVariant.upsert.mock.calls[0]?.[0];
    expect(call.where).toEqual({ userId_agentId: { userId: 'u', agentId: 'ag' } });
    expect(call.create).toEqual({ userId: 'u', agentId: 'ag', tone: null, difficulty: 'B2' });
    expect(call.update).toEqual({ tone: null, difficulty: 'B2' });
  });

  it("ne crée rien pour un contact qui n'existe pas", async () => {
    const { db, store } = fake();
    db.agent.findUnique.mockResolvedValue(null);
    expect(await store.set('u', 'x', { tone: 'neutre' })).toBe(false);
    expect(db.contactVariant.upsert).not.toHaveBeenCalled();
  });

  it('retire les réglages', async () => {
    const { db, store } = fake();
    await store.clear('u', 'jade');
    expect(db.contactVariant.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u', agent: { slug: 'jade' } },
    });
  });
});
