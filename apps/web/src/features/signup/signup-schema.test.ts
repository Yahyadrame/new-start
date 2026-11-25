import { describe, expect, it } from 'vitest';
import { SignupFormSchema } from './signup-schema';

const valid = {
  firstName: ' Awa ',
  phone: '77 123 45 67',
  birthYear: '2000',
  email: ' Awa@Example.com ',
  goal: 'WORK',
  goals: ['WORK'],
  interests: ['MUSIC'],
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

describe('SignupFormSchema : choix multiples', () => {
  it('garde les objectifs et les centres d’intérêt', () => {
    expect(SignupFormSchema.parse(valid)).toMatchObject({ goals: ['WORK'], interests: ['MUSIC'] });
  });
  it('refuse zéro objectif, plus de 4 objectifs ou plus de 8 centres d’intérêt', () => {
    expect(SignupFormSchema.safeParse({ ...valid, goals: [] }).success).toBe(false);
    const five = ['WORK', 'TRAVEL', 'FRIENDS', 'STUDIES', 'EXAMS'];
    expect(SignupFormSchema.safeParse({ ...valid, goals: five }).success).toBe(false);
    const nine = ['MUSIC', 'SPORT', 'ART', 'TECH', 'BOOKS', 'NATURE', 'FAITH', 'FASHION', 'HEALTH'];
    expect(SignupFormSchema.safeParse({ ...valid, interests: nine }).success).toBe(false);
  });
});
