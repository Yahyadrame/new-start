import { Module } from '@nestjs/common';
import {
  CONVERSATIONS_STORE,
  ConversationsService,
  type ConversationsStore,
} from './application/conversations.js';
import { PrismaConversationsStore } from './infrastructure/prisma-conversations.store.js';
import { ConversationsController } from './interface/conversations.controller.js';

@Module({
  controllers: [ConversationsController],
  providers: [
    { provide: CONVERSATIONS_STORE, useClass: PrismaConversationsStore },
    {
      provide: ConversationsService,
      inject: [CONVERSATIONS_STORE],
      useFactory: (store: ConversationsStore) => new ConversationsService(store),
    },
  ],
})
export class ConversationsModule {}
