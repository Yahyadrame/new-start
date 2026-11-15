import { describe, expect, it } from 'vitest';
import { askAgent, parseAgentReply } from './agent.js';
import type { LlmProvider, LlmRequest } from './types.js';

const request: Omit<LlmRequest, 'json'> = {
  system: 's',
  messages: [{ role: 'user', content: 'hi' }],
};

function scripted(...texts: string[]): LlmProvider & { calls: LlmRequest[] } {
  const calls: LlmRequest[] = [];
  return {
    name: 'scripted',
    calls,
    async complete(r) {
      calls.push(r);
      return { text: texts[calls.length - 1] ?? texts.at(-1) ?? '' };
    },
  };
}

describe('parseAgentReply', () => {
  it('lit un JSON valide, fix absent devient null', () => {
    expect(parseAgentReply('{"reply":"Hi"}')).toEqual({ reply: 'Hi', fix: null });
  });

  it('lit une correction complète', () => {
    const fix = { better: 'I went home.', why: 'Passé simple.' };
    expect(parseAgentReply(JSON.stringify({ reply: 'Nice', fix }))).toEqual({ reply: 'Nice', fix });
  });

  it('retire un bloc de code Markdown', () => {
    expect(parseAgentReply('```json\n{"reply":"Hi","fix":null}\n```')).toEqual({
      reply: 'Hi',
      fix: null,
    });
  });

  it.each(['pas du json', '{"reply":""}', '{"reply":"a","fix":{"better":"b"}}', '[]'])(
    'refuse %s',
    (text) => {
      expect(parseAgentReply(text)).toBeNull();
    },
  );
});

describe('askAgent', () => {
  it('répond du premier coup quand le JSON est valide', async () => {
    const llm = scripted('{"reply":"Hello","fix":null}');
    await expect(askAgent(llm, request)).resolves.toEqual({
      reply: 'Hello',
      fix: null,
      valid: true,
    });
    expect(llm.calls).toHaveLength(1);
    expect(llm.calls[0]?.json).toBe(true);
  });

  it('refait une tentative avec le rappel du format', async () => {
    const llm = scripted('oops', '{"reply":"Hello","fix":null}');
    const out = await askAgent(llm, request);
    expect(out).toEqual({ reply: 'Hello', fix: null, valid: true });
    const second = llm.calls[1]?.messages ?? [];
    expect(second.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(second[2]?.content).toContain('only this JSON');
  });

  it('garde le texte brut et fix = null après deux échecs', async () => {
    const llm = scripted('premier', ' second ');
    await expect(askAgent(llm, request)).resolves.toEqual({
      reply: 'second',
      fix: null,
      valid: false,
    });
  });

  it('retombe sur le premier texte si le second est vide', async () => {
    const llm = scripted('premier', '  ');
    expect((await askAgent(llm, request)).reply).toBe('premier');
  });
});
