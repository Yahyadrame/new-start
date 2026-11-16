import { describe, expect, it } from 'vitest';
import { SignupFormSchema } from './signup-schema';

const valid = {
  firstName: ' Awa ',
  phone: '77 123 45 67',
  birthYear: '2000',
  email: ' Awa@Example.com ',
  goal: 'WORK',
  acceptTerms: true,
  smsOptIn: false,
  voiceConsent: false,
};

describe('SignupFormSchema', () => {
  it('nettoie les saisies : E.164, année en nombre, e-mail en minuscules', () => {
    expect(SignupFormSchema.parse(valid)).toMatchObject({
      firstName: 'Awa',
      phone: '+221771234567',
      birthYear: 2000,
      email: 'awa@example.com',
    });
  });
  it.each([
    ['firstName', 'A'],
    ['phone', '123'],
    ['birthYear', 'abc'],
    ['birthYear', '1800'],
    ['email', 'pas-un-email'],
    ['goal', ''],
    ['acceptTerms', false],
  ])('refuse %s = %s', (field, value) => {
    const result = SignupFormSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe(field);
  });
});
