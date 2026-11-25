import { describe, expect, it } from 'vitest';
import type { ReplyContext } from './agent-reply.js';
import { applyVariant, TONE_STYLES } from './agent-variant.js';

const context: ReplyContext = {
  agent: { name: 'Jade', persona: 'p', style: 'slangy', accent: 'en-US' },
  learner: { firstName: 'Awa', level: 'A1', goal: 'TRAVEL' },
  history: [{ author: 'USER', text: 'Hi' }],
};

describe('applyVariant', () => {
  it('ne change rien sans réglage', () => {
    expect(applyVariant(context, null)).toBe(context);
    expect(applyVariant(context, {})).toEqual(context);
  });
  it('remplace le style par le ton choisi', () => {
    const out = applyVariant(context, { tone: 'soigne' });
    expect(out.agent.style).toBe(TONE_STYLES.soigne);
    expect(out.learner.level).toBe('A1');
  });
  it('remplace le niveau par la difficulté choisie, sans toucher au reste', () => {
    const out = applyVariant(context, { difficulty: 'C1' });
    expect(out.learner.level).toBe('C1');
    expect(out.agent).toEqual(context.agent);
    expect(out.history).toBe(context.history);
  });
});
