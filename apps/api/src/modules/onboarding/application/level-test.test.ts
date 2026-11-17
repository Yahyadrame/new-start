import type { LlmProvider } from '@newstart/ai';
import { describe, expect, it, vi } from 'vitest';
import { LevelTest, type LevelStore } from './level-test.js';

const result = {
  level: 'B2',
  justification: 'ok',
  strengths: ['a', 'b', 'c'],
  weaknesses: ['d', 'e', 'f'],
};

function setup(saved: number[] = [1, 2, 3, 4, 5], llmText = JSON.stringify(result)) {
  const store: LevelStore = {
    saveAnswer: vi.fn().mockResolvedValue(undefined),
    listAnswers: vi
      .fn()
      .mockResolvedValue(saved.map((position) => ({ position, text: `r${position}` }))),
    saveLevel: vi.fn().mockResolvedValue(undefined),
  };
  const complete = vi.fn().mockResolvedValue({ text: llmText });
  const service = new LevelTest(store, { name: 't', complete } as LlmProvider);
  return { store, complete, service };
}

describe('LevelTest.answer', () => {
  it('garde la réponse et donne la question suivante, sans appeler le LLM', async () => {
    const { store, complete, service } = setup();
    await expect(service.answer('u', { position: 2, text: 'hello' })).resolves.toEqual({
      done: false,
      next: 3,
    });
    expect(store.saveAnswer).toHaveBeenCalledWith('u', 2, 'hello');
    expect(complete).not.toHaveBeenCalled();
    expect(store.saveLevel).not.toHaveBeenCalled();
  });

  it('évalue après la 5e réponse et enregistre le niveau', async () => {
    const { store, complete, service } = setup();
    await expect(service.answer('u', { position: 5, text: 'bye' })).resolves.toEqual({
      done: true,
      ...result,
    });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(store.saveLevel).toHaveBeenCalledWith('u', 'B2');
  });

  it('répond 409 si une réponse précédente manque', async () => {
    const { store, complete, service } = setup([1, 2, 4, 5]);
    await expect(service.answer('u', { position: 5, text: 'bye' })).rejects.toMatchObject({
      status: 409,
      response: { code: 'LEVEL_TEST_INCOMPLETE' },
    });
    expect(complete).not.toHaveBeenCalled();
    expect(store.saveLevel).not.toHaveBeenCalled();
  });

  it("n'enregistre pas le niveau quand l'évaluation échoue", async () => {
    const { store, service } = setup([1, 2, 3, 4, 5], 'pas du json');
    await expect(service.answer('u', { position: 5, text: 'bye' })).rejects.toMatchObject({
      status: 503,
    });
    expect(store.saveLevel).not.toHaveBeenCalled();
  });
});
