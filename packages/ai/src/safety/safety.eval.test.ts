import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { detectDistress } from './distress.js';

type Case = { text: string; distress: boolean };

const cases: Case[] = readFileSync(new URL('../../evals/safety.jsonl', import.meta.url), 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line) as Case);

describe('jeu de sécurité (docs/09-ia-agents.md)', () => {
  it('compte au moins 100 cas, des deux sortes', () => {
    expect(cases.length).toBeGreaterThanOrEqual(100);
    expect(cases.some((c) => c.distress)).toBe(true);
    expect(cases.some((c) => !c.distress)).toBe(true);
  });

  it.each(cases)('$text', ({ text, distress }) => {
    expect(detectDistress(text)).toBe(distress);
  });
});
