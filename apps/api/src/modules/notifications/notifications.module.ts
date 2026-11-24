import { Inject, Module, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import {
  NOTIFICATIONS_STORE,
  NotificationsService,
  type NotificationsStore,
} from './application/notifications.js';
import {
  PUSH_SUBSCRIPTIONS_STORE,
  PushSubscriptionsService,
  type PushSubscriptionsStore,
} from './application/push-subscriptions.js';
import { RemindersScheduler } from './application/reminders-scheduler.js';
import {
  REMINDERS_STORE,
  SendReminders,
  type RemindersStore,
} from './application/send-reminders.js';
import { PrismaNotificationsStore } from './infrastructure/prisma-notifications.store.js';
import { PrismaPushSubscriptionsStore } from './infrastructure/prisma-push-subscriptions.store.js';
import { PrismaRemindersStore } from './infrastructure/prisma-reminders.store.js';
import { NotificationsController } from './interface/notifications.controller.js';
import { PushSubscriptionsController } from './interface/push-subscriptions.controller.js';

@Module({
  controllers: [NotificationsController, PushSubscriptionsController],
  providers: [
    { provide: NOTIFICATIONS_STORE, useClass: PrismaNotificationsStore },
    { provide: REMINDERS_STORE, useClass: PrismaRemindersStore },
    { provide: PUSH_SUBSCRIPTIONS_STORE, useClass: PrismaPushSubscriptionsStore },
    {
      provide: PushSubscriptionsService,
      inject: [PUSH_SUBSCRIPTIONS_STORE],
      useFactory: (store: PushSubscriptionsStore) => new PushSubscriptionsService(store),
    },
    {
      provide: NotificationsService,
      inject: [NOTIFICATIONS_STORE],
      useFactory: (store: NotificationsStore) => new NotificationsService(store),
    },
    {
      provide: RemindersScheduler,
      inject: [REMINDERS_STORE, ENV],
      useFactory: (store: RemindersStore, env: Env) => {
        const send = new SendReminders(store);
        return new RemindersScheduler((now) => send.execute(now), env.REMINDERS_INTERVAL_SECONDS);
      },
    },
  ],
})
export class NotificationsModule implements OnApplicationBootstrap, OnModuleDestroy {
  constructor(@Inject(RemindersScheduler) private readonly scheduler: RemindersScheduler) {}

  onApplicationBootstrap(): void {
    this.scheduler.start();
  }

  onModuleDestroy(): void {
    this.scheduler.stop();
  }
}
