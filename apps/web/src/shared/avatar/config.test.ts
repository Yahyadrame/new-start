import { describe, expect, it } from 'vitest';
import { parseContactStyle, parseShape } from './config';

describe('réglages des avatars', () => {
  it('prend « duo » et « carre » par défaut', () => {
    expect(parseContactStyle(undefined)).toBe('duo');
    expect(parseShape(undefined)).toBe('carre');
  });

  it('accepte un style connu et la forme ronde', () => {
    expect(parseContactStyle('anneau')).toBe('anneau');
    expect(parseShape('rond')).toBe('rond');
  });

  it('retombe sur le défaut si la valeur est inconnue', () => {
    expect(parseContactStyle('fluo')).toBe('duo');
    expect(parseShape('triangle')).toBe('carre');
  });
});
