import { describe, expect, it } from 'vitest';
import { isAdult } from './age.js';

describe('isAdult', () => {
  it('ne compte comme majeure que la personne qui l’est à coup sûr', () => {
    expect(isAdult(2007, 2026)).toBe(true);
    expect(isAdult(2008, 2026)).toBe(false);
    expect(isAdult(2012, 2026)).toBe(false);
  });

  it('refuse sans année de naissance', () => {
    expect(isAdult(null, 2026)).toBe(false);
    expect(isAdult(undefined, 2026)).toBe(false);
  });
});
