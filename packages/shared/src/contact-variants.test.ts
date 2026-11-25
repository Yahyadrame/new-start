import { describe, expect, it } from 'vitest';
import { ContactVariant, ContactVariants } from './contact-variants.js';

describe('ContactVariant', () => {
  it('accepte un ton, une difficulté, ou les deux', () => {
    expect(ContactVariant.safeParse({ tone: 'soigne' }).success).toBe(true);
    expect(ContactVariant.safeParse({ difficulty: 'C1' }).success).toBe(true);
    expect(ContactVariant.safeParse({ tone: 'neutre', difficulty: 'A2' }).success).toBe(true);
  });
  it('refuse un réglage vide, inconnu ou en trop', () => {
    expect(ContactVariant.safeParse({}).success).toBe(false);
    expect(ContactVariant.safeParse({ tone: 'grossier' }).success).toBe(false);
    expect(ContactVariant.safeParse({ difficulty: 'A1' }).success).toBe(false);
    expect(ContactVariant.safeParse({ tone: 'neutre', accent: 'en-GB' }).success).toBe(false);
  });
  it('range les réglages par contact', () => {
    expect(ContactVariants.safeParse({ jade: { tone: 'neutre' } }).success).toBe(true);
  });
});
