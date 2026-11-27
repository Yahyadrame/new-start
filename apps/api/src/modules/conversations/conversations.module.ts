import { Module } from '@nestjs/common';
import type { AiProviders } from '@newstart/ai';
import { ENV, type Env } from '../../config/env.js';
import { AI } from '../../shared/ai/ai.module.js';
import { createMediaStores, type MediaStores } from '../../shared/media/media-store.js';
import {
  AGENT_REPLY_STORE,
  AgentReplyService,
  type AgentReplyStore,
} from './application/agent-reply.js';
import { PrismaAgentReplyStore } from './infrastructure/prisma-agent-reply.store.js';
import { MediaSend } from './application/media-send.js';
import { PrismaMediaMessagesStore } from './infrastructure/prisma-media-messages.store.js';
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

const MEDIA_STORES = Symbol('MEDIA_STORES');

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
    // Les variables MEDIA_* sont vérifiées par `createMediaStores`.
    { provide: MEDIA_STORES, useFactory: () => createMediaStores(process.env) },
    {
      provide: ConversationsService,
      inject: [CONVERSATIONS_STORE, AgentReplyService, ENV, MEDIA_STORES],
      useFactory: (
        store: ConversationsStore,
        replies: AgentReplyService,
        env: Env,
        media: MediaStores,
      ) => new ConversationsService(store, undefined, replies, env.MESSAGES_PER_DAY, media),
    },
    PrismaMediaMessagesStore,
    {
      provide: MediaSend,
      inject: [PrismaMediaMessagesStore, AI, MEDIA_STORES, ENV, AgentReplyService],
      useFactory: (
        store: PrismaMediaMessagesStore,
        ai: AiProviders,
        media: MediaStores,
        env: Env,
        replies: AgentReplyService,
      ) =>
        new MediaSend(
          store,
          ai.stt,
          media,
          {
            voiceEnabled: env.VOICE_MESSAGES_ENABLED,
            voicePerDay: env.VOICE_MESSAGES_PER_DAY,
            photosPerDay: env.PHOTOS_PER_DAY,
          },
          replies,
        ),
    },
  ],
})
export class ConversationsModule {}
