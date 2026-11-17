import { describe, expect, it } from 'vitest';
import { LEVEL_QUESTIONS, LevelAnswerBody, LevelResult } from './level-test.js';

describe('LEVEL_QUESTIONS', () => {
  it('compte 5 questions numérotées de 1 à 5', () => {
    expect(LEVEL_QUESTIONS.map((q) => q.position)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('LevelAnswerBody', () => {
  it('accepte une réponse et retire les espaces autour', () => {
    expect(LevelAnswerBody.parse({ position: 2, text: '  I work.  ' })).toEqual({
      position: 2,
      text: 'I work.',
    });
  });
  it.each([
    { position: 0, text: 'a' },
    { position: 6, text: 'a' },
    { position: 1.5, text: 'a' },
    { position: 1, text: '   ' },
    { position: 1, text: 'a'.repeat(1001) },
  ])('refuse %j', (body) => {
    expect(LevelAnswerBody.safeParse(body).success).toBe(false);
  });
});

describe('LevelResult', () => {
  const ok = {
    level: 'B1',
    justification: 'x',
    strengths: ['a', 'b', 'c'],
    weaknesses: ['d', 'e', 'f'],
  };
  it('accepte un résultat complet', () => {
    expect(LevelResult.safeParse(ok).success).toBe(true);
  });
  it.each([
    { ...ok, level: 'D1' },
    { ...ok, strengths: ['a', 'b'] },
    { ...ok, weaknesses: ['a', 'b', 'c', 'd'] },
    { ...ok, justification: '' },
  ])('refuse %j', (r) => {
    expect(LevelResult.safeParse(r).success).toBe(false);
  });
});
