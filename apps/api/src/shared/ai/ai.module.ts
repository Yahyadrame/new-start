import { Global, Module } from '@nestjs/common';
import { createAiProviders, type AiProviders } from '@newstart/ai';
import { ENV, type Env } from '../../config/env.js';

export const AI = Symbol('AI');

@Global()
@Module({
  providers: [
    {
      provide: AI,
      inject: [ENV],
      useFactory: (e: Env): AiProviders =>
        createAiProviders({
          LLM_PROVIDER: e.LLM_PROVIDER,
          STT_PROVIDER: e.STT_PROVIDER,
          TTS_PROVIDER: e.TTS_PROVIDER,
          GROQ_API_KEY: e.GROQ_API_KEY,
          GEMINI_API_KEY: e.GEMINI_API_KEY,
          AI_MAX_CALLS_PER_MONTH: e.AI_MAX_CALLS_PER_MONTH,
        }),
    },
  ],
  exports: [AI],
})
export class AiModule {}
