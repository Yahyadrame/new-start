import type { LlmProvider, LlmRequest } from '@newstart/ai';
import { describe, expect, it, vi } from 'vitest';
import { evaluateLevel } from './evaluate-level.js';

const good = {
  level: 'B1',
  justification: 'Tu te fais comprendre sur des sujets courants.',
  strengths: ['a', 'b', 'c'],
  weaknesses: ['d', 'e', 'f'],
};
const answers = ['one', 'two', 'three', 'four', 'five'];

function llm(...texts: (string | Error)[]) {
  const complete = vi.fn<(r: LlmRequest) => Promise<{ text: string }>>();
  for (const t of texts) {
    if (t instanceof Error) complete.mockRejectedValueOnce(t);
    else complete.mockResolvedValueOnce({ text: t });
  }
  return { provider: { name: 'test', complete } as LlmProvider, complete };
}

describe('evaluateLevel', () => {
  it('renvoie le résultat et envoie les questions avec les réponses', async () => {
    const { provider, complete } = llm(JSON.stringify(good));
    await expect(evaluateLevel(provider, answers)).resolves.toEqual(good);
    const req = complete.mock.calls[0]?.[0];
    expect(req?.json).toBe(true);
    const sent = JSON.parse(req?.messages[0]?.content ?? '') as {
      question: string;
      answer: string;
    }[];
    expect(sent).toHaveLength(5);
    expect(sent[4]?.answer).toBe('five');
  });

  it('accepte le JSON entouré d’un bloc de code', async () => {
    const { provider } = llm('```json\n' + JSON.stringify(good) + '\n```');
    await expect(evaluateLevel(provider, answers)).resolves.toEqual(good);
  });

  it('relance une fois quand le JSON est invalide', async () => {
    const { provider, complete } = llm('pas du json', JSON.stringify(good));
    await expect(evaluateLevel(provider, answers)).resolves.toEqual(good);
    expect(complete).toHaveBeenCalledTimes(2);
    expect(complete.mock.calls[1]?.[0].messages).toHaveLength(3);
  });

  it('répond 503 AI_UNAVAILABLE après deux réponses invalides', async () => {
    const { provider } = llm('non', JSON.stringify({ ...good, level: 'Z9' }));
    await expect(evaluateLevel(provider, answers)).rejects.toMatchObject({
      status: 503,
      response: { code: 'AI_UNAVAILABLE' },
    });
  });

  it('répond 503 AI_UNAVAILABLE quand le fournisseur échoue', async () => {
    const { provider } = llm(new Error('réseau'));
    await expect(evaluateLevel(provider, answers)).rejects.toMatchObject({
      status: 503,
      response: { code: 'AI_UNAVAILABLE' },
    });
  });
});
