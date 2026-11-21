import { Module } from '@nestjs/common';
import {
  NOTIFICATIONS_STORE,
  NotificationsService,
  type NotificationsStore,
} from './application/notifications.js';
import { PrismaNotificationsStore } from './infrastructure/prisma-notifications.store.js';
import { NotificationsController } from './interface/notifications.controller.js';

@Module({
  controllers: [NotificationsController],
  providers: [
    { provide: NOTIFICATIONS_STORE, useClass: PrismaNotificationsStore },
    {
      provide: NotificationsService,
      inject: [NOTIFICATIONS_STORE],
      useFactory: (store: NotificationsStore) => new NotificationsService(store),
    },
  ],
})
export class NotificationsModule {}
