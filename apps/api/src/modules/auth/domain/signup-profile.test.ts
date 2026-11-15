import { describe, expect, it } from 'vitest';
import { PhoneE164, SignupProfile } from './signup-profile.js';

const valid = {
  firstName: 'Awa',
  phone: '77 123 45 67',
  goal: 'WORK',
  birthYear: 2000,
  acceptTerms: true,
};

describe('PhoneE164', () => {
  it('suppose +221 sans indicatif et renvoie le format E.164', () => {
    expect(PhoneE164.parse('77 123 45 67')).toBe('+221771234567');
  });
  it('garde un autre indicatif', () => {
    expect(PhoneE164.parse('+33 6 12 34 56 78')).toBe('+33612345678');
  });
  it('refuse un numéro invalide', () => {
    expect(PhoneE164.safeParse('123').success).toBe(false);
    expect(PhoneE164.safeParse('abc').success).toBe(false);
  });
});

describe('SignupProfile', () => {
  it('accepte un profil complet et décoche les SMS et la voix par défaut', () => {
    expect(SignupProfile.parse(valid)).toMatchObject({
      phone: '+221771234567',
      smsOptIn: false,
      voiceConsent: false,
    });
  });
  it('limite le prénom à 2 à 30 caractères, espaces retirés', () => {
    expect(SignupProfile.safeParse({ ...valid, firstName: ' A ' }).success).toBe(false);
    expect(SignupProfile.safeParse({ ...valid, firstName: 'x'.repeat(31) }).success).toBe(false);
    expect(SignupProfile.parse({ ...valid, firstName: '  Awa ' }).firstName).toBe('Awa');
  });
  it('exige le consentement aux conditions', () => {
    expect(SignupProfile.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
    expect(SignupProfile.safeParse({ ...valid, acceptTerms: undefined }).success).toBe(false);
  });
  it('refuse un objectif inconnu, une année absurde ou un champ en trop', () => {
    expect(SignupProfile.safeParse({ ...valid, goal: 'FUN' }).success).toBe(false);
    expect(SignupProfile.safeParse({ ...valid, birthYear: 1800 }).success).toBe(false);
    expect(SignupProfile.safeParse({ ...valid, birthYear: 2999 }).success).toBe(false);
    expect(SignupProfile.safeParse({ ...valid, admin: true }).success).toBe(false);
  });
});
