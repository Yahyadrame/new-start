import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaNotificationsStore } from './prisma-notifications.store.js';
import { PrismaPushSubscriptionsStore } from './prisma-push-subscriptions.store.js';
import { PrismaRemindersStore } from './prisma-reminders.store.js';

/**
 * Les autres tests fabriquent les stores à la main : ils ne voient pas un `PrismaService` mal injecté.
 * Ici c'est Nest qui construit le store, comme au démarrage de l'API (bug de staging du 2026-11-24 :
 * `this.prisma` valait `undefined` faute de `@Inject`).
 */
describe.each([
  ['PrismaNotificationsStore', PrismaNotificationsStore],
  ['PrismaPushSubscriptionsStore', PrismaPushSubscriptionsStore],
  ['PrismaRemindersStore', PrismaRemindersStore],
])('%s', (_name, Store) => {
  it('reçoit le PrismaService par injection Nest', async () => {
    const prisma = { marker: vi.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [{ provide: PrismaService, useValue: prisma }, Store],
    }).compile();
    expect(Reflect.get(moduleRef.get(Store), 'prisma')).toBe(prisma);
  });
});
