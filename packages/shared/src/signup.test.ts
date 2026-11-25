import { describe, expect, it } from 'vitest';
import {
  GOAL_TOPIC,
  INTEREST_TOPIC,
  PhoneE164,
  recommendedTopics,
  SIGNUP_GOALS,
  SIGNUP_INTERESTS,
  SignupProfile,
} from './signup.js';

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

describe('SIGNUP_GOALS', () => {
  it('garde les quatre objectifs d\u2019origine en tête de liste', () => {
    expect([...SIGNUP_GOALS].slice(0, 4)).toEqual(['SCHOLARSHIP', 'WORK', 'TRAVEL', 'FRIENDS']);
  });
  it('accepte chacun d\u2019eux dans le profil', () => {
    for (const goal of SIGNUP_GOALS) {
      expect(SignupProfile.safeParse({ ...valid, goal }).success).toBe(true);
    }
  });
});

describe('objectifs et centres d\u2019intérêt multiples', () => {
  it('reste valable sans eux (anciens clients) : listes vides', () => {
    expect(SignupProfile.parse(valid)).toMatchObject({ goals: [], interests: [] });
  });
  it('accepte jusqu\u2019à 4 objectifs et 8 centres d\u2019intérêt connus', () => {
    const goals = SIGNUP_GOALS.slice(0, 4);
    const interests = SIGNUP_INTERESTS.slice(0, 8);
    expect(SignupProfile.parse({ ...valid, goals, interests })).toMatchObject({ goals, interests });
  });
  it('refuse trop de choix ou un choix inconnu', () => {
    expect(SignupProfile.safeParse({ ...valid, goals: SIGNUP_GOALS.slice(0, 5) }).success).toBe(
      false,
    );
    expect(
      SignupProfile.safeParse({ ...valid, interests: SIGNUP_INTERESTS.slice(0, 9) }).success,
    ).toBe(false);
    expect(SignupProfile.safeParse({ ...valid, interests: ['MAGIC'] }).success).toBe(false);
  });
});

describe('recommendedTopics', () => {
  it('donne un thème à chaque centre d’intérêt, et à chaque objectif sauf se faire des amis', () => {
    for (const i of SIGNUP_INTERESTS) expect(INTEREST_TOPIC[i]).toBeTruthy();
    expect(SIGNUP_GOALS.filter((g) => !GOAL_TOPIC[g])).toEqual(['FRIENDS']);
  });
  it('met l’objectif en premier et retire les doublons', () => {
    expect(recommendedTopics('WORK', ['BUSINESS', 'MUSIC', 'MOVIES'])).toEqual(['work', 'culture']);
    expect(recommendedTopics('FRIENDS', [])).toEqual([]);
  });
});
