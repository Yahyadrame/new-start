import { Module } from '@nestjs/common';
import type { AiProviders } from '@newstart/ai';
import { AI } from '../../shared/ai/ai.module.js';
import { LEVEL_STORE, LevelTest, type LevelStore } from './application/level-test.js';
import { PrismaLevelStore } from './infrastructure/prisma-level.store.js';
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
  ],
})
export class OnboardingModule {}
