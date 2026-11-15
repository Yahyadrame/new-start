import { describe, expect, it } from 'vitest';
import { generateCode, hashCode } from './otp.js';

describe('generateCode', () => {
  it('donne toujours 6 chiffres, zéros initiaux compris', () => {
    for (let i = 0; i < 500; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });
  it('ne répète pas le même code à chaque appel', () => {
    expect(new Set(Array.from({ length: 50 }, generateCode)).size).toBeGreaterThan(40);
  });
});

describe('hashCode', () => {
  it('est stable pour la même clé, destination et code', () => {
    expect(hashCode('k', 'a@test.dev', '123456')).toBe(hashCode('k', 'a@test.dev', '123456'));
  });
  it('change avec la clé, la destination ou le code', () => {
    const base = hashCode('k', 'a@test.dev', '123456');
    expect(hashCode('autre', 'a@test.dev', '123456')).not.toBe(base);
    expect(hashCode('k', 'b@test.dev', '123456')).not.toBe(base);
    expect(hashCode('k', 'a@test.dev', '654321')).not.toBe(base);
  });
  it('ne contient pas le code en clair', () => {
    expect(hashCode('k', 'a@test.dev', '123456')).not.toContain('123456');
  });
});
