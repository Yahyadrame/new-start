import { Module } from '@nestjs/common';
import type { AiProviders } from '@newstart/ai';
import { ENV, type Env } from '../../config/env.js';
import { AI } from '../../shared/ai/ai.module.js';
import { createMediaStores } from '../../shared/media/media-store.js';
import {
  AGENT_REPLY_STORE,
  AgentReplyService,
  type AgentReplyStore,
} from './application/agent-reply.js';
import { PrismaAgentReplyStore } from './infrastructure/prisma-agent-reply.store.js';
import {
  CONVERSATIONS_STORE,
  ConversationsService,
  type ConversationsStore,
} from './application/conversations.js';
import {
  TRANSLATION_STORE,
  TranslationService,
  type TranslationStore,
} from './application/translation.js';
import { PrismaTranslationStore } from './infrastructure/prisma-translation.store.js';
import { MessagesController } from './interface/messages.controller.js';
import { PrismaConversationsStore } from './infrastructure/prisma-conversations.store.js';
import { ConversationsController } from './interface/conversations.controller.js';

@Module({
  controllers: [ConversationsController, MessagesController],
  providers: [
    { provide: CONVERSATIONS_STORE, useClass: PrismaConversationsStore },
    { provide: AGENT_REPLY_STORE, useClass: PrismaAgentReplyStore },
    {
      provide: AgentReplyService,
      inject: [AGENT_REPLY_STORE, AI],
      useFactory: (store: AgentReplyStore, ai: AiProviders) => new AgentReplyService(store, ai.llm),
    },
    { provide: TRANSLATION_STORE, useClass: PrismaTranslationStore },
    {
      provide: TranslationService,
      inject: [TRANSLATION_STORE, AI],
      useFactory: (store: TranslationStore, ai: AiProviders) =>
        new TranslationService(store, ai.llm),
    },
    {
      provide: ConversationsService,
      inject: [CONVERSATIONS_STORE, AgentReplyService, ENV],
      useFactory: (store: ConversationsStore, replies: AgentReplyService, env: Env) =>
        new ConversationsService(
          store,
          undefined,
          replies,
          env.MESSAGES_PER_DAY,
          // Les variables MEDIA_* sont vérifiées par `createMediaStores`.
          createMediaStores(process.env),
        ),
    },
  ],
})
export class ConversationsModule {}
