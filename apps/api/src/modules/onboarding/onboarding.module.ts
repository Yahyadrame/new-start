import { Module } from '@nestjs/common';
import type { AiProviders } from '@newstart/ai';
import { AI } from '../../shared/ai/ai.module.js';
import { LEVEL_STORE, LevelTest, type LevelStore } from './application/level-test.js';
import { Voice, VOICE_STORE, type VoiceStore } from './application/voice.js';
import { PrismaLevelStore } from './infrastructure/prisma-level.store.js';
import { PrismaVoiceStore } from './infrastructure/prisma-voice.store.js';
import { OnboardingController } from './interface/onboarding.controller.js';

@Module({
  controllers: [OnboardingController],
  providers: [
    { provide: LEVEL_STORE, useClass: PrismaLevelStore },
    {
      provide: LevelTest,
      inject: [LEVEL_STORE, AI],
      useFactory: (store: LevelStore, ai: AiProviders) => new LevelTest(store, ai.llm),
    },
    { provide: VOICE_STORE, useClass: PrismaVoiceStore },
    {
      provide: Voice,
      inject: [VOICE_STORE, AI],
      useFactory: (store: VoiceStore, ai: AiProviders) => new Voice(store, ai.stt),
    },
  ],
})
export class OnboardingModule {}
