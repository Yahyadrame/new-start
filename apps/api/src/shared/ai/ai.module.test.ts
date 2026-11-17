import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AiProviders } from '@newstart/ai';
import { describe, expect, it } from 'vitest';
import { ENV } from '../../config/env.js';
import { AI, AiModule } from './ai.module.js';

async function build(env: object) {
  @Global()
  @Module({ providers: [{ provide: ENV, useValue: env }], exports: [ENV] })
  class FakeConfig {}
  const module = await Test.createTestingModule({ imports: [FakeConfig, AiModule] }).compile();
  return module.get<AiProviders>(AI);
}

describe('AiModule', () => {
  it('sans fournisseur ni clé, donne des adaptateurs factices', async () => {
    const ai = await build({});
    expect([ai.llm.name, ai.stt.name, ai.tts.name]).toEqual(['fake', 'fake', 'fake']);
  });
  it('choisit Groq quand le fournisseur et la clé sont donnés', async () => {
    const ai = await build({ LLM_PROVIDER: 'groq', GROQ_API_KEY: 'k' });
    expect(ai.llm.name).not.toBe('fake');
  });
});
