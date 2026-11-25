import { beforeEach, describe, expect, it } from 'vitest';
import { clearPendingSignup, loadPendingSignup, savePendingSignup } from './pending-signup';
import type { SignupFormValues } from './signup-schema';

export const pending: SignupFormValues = {
  firstName: 'Awa',
  phone: '+221771234567',
  birthYear: 2000,
  goal: 'WORK',
  goals: ['WORK'],
  interests: [],
  acceptTerms: true,
  smsOptIn: false,
  voiceConsent: false,
  email: 'awa@example.com',
};

beforeEach(() => sessionStorage.clear());

describe('profil en attente', () => {
  it('se relit tel quel puis disparaît quand on le vide', () => {
    savePendingSignup(pending);
    expect(loadPendingSignup()).toEqual(pending);
    clearPendingSignup();
    expect(loadPendingSignup()).toBeNull();
  });
  it('ignore un contenu abîmé ou invalide', () => {
    sessionStorage.setItem('ns_pending_signup', '{pas du json');
    expect(loadPendingSignup()).toBeNull();
    sessionStorage.setItem('ns_pending_signup', JSON.stringify({ email: 'x' }));
    expect(loadPendingSignup()).toBeNull();
  });
});
