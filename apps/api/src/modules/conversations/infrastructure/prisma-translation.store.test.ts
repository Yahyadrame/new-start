import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaTranslationStore } from './prisma-translation.store.js';

const fake = () => {
  const message = {
    findFirst: vi.fn().mockResolvedValue({ text: 'Hey!', translationFr: null }),
    update: vi.fn().mockResolvedValue(undefined),
  };
  return { message, store: new PrismaTranslationStore({ message } as unknown as PrismaService) };
};

describe('PrismaTranslationStore', () => {
  it('cherche un message d’agent dans les conversations de la personne', async () => {
    const { message, store } = fake();
    expect(await store.find('u1', 'm1')).toEqual({ text: 'Hey!', translationFr: null });
    expect(message.findFirst).toHaveBeenCalledWith({
      where: { id: 'm1', author: 'AGENT', conversation: { userId: 'u1' } },
      select: { text: true, translationFr: true },
    });
  });

  it('enregistre la traduction sur le message', async () => {
    const { message, store } = fake();
    await store.save('m1', 'Salut !');
    expect(message.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { translationFr: 'Salut !' },
    });
  });
});
