import { describe, expect, it } from 'vitest';
import { parseEnv } from '../../config/env.js';
import { FakeMailer } from '../mailer/mailer.js';
import { FakeSmsSender } from '../sms/sms.js';
import { BrevoMailer, BrevoSmsSender } from './brevo.js';
import { createMailer, createSmsSender } from './messaging.js';

const base = { DATABASE_URL: 'postgresql://x' };
const env = (extra: Record<string, string>) => parseEnv({ ...base, ...extra });

describe('createMailer', () => {
  it('reste factice sans clé', () => {
    expect(createMailer(env({}))).toBeInstanceOf(FakeMailer);
  });
  it("reste factice sans adresse d'expédition", () => {
    expect(createMailer(env({ BREVO_API_KEY: 'k' }))).toBeInstanceOf(FakeMailer);
  });
  it('passe sur Brevo avec la clé et MAIL_FROM', () => {
    expect(createMailer(env({ BREVO_API_KEY: 'k', MAIL_FROM: 'a@test.dev' }))).toBeInstanceOf(
      BrevoMailer,
    );
  });
});

describe('createSmsSender', () => {
  it('reste factice par défaut, même avec une clé', () => {
    expect(createSmsSender(env({ BREVO_API_KEY: 'k' }))).toBeInstanceOf(FakeSmsSender);
  });
  it('reste factice si SMS_ENABLED sans clé', () => {
    expect(createSmsSender(env({ SMS_ENABLED: 'true' }))).toBeInstanceOf(FakeSmsSender);
  });
  it('passe sur Brevo quand les SMS sont activés avec une clé', () => {
    expect(createSmsSender(env({ BREVO_API_KEY: 'k', SMS_ENABLED: 'true' }))).toBeInstanceOf(
      BrevoSmsSender,
    );
  });
});

describe('variables Brevo', () => {
  it('applique les valeurs par défaut', () => {
    const e = env({});
    expect(e).toMatchObject({
      MAIL_FROM_NAME: 'New Start',
      SMS_ENABLED: false,
      SMS_SENDER: 'NewStart',
    });
  });
  it('traite les chaînes vides comme absentes', () => {
    expect(
      env({ BREVO_API_KEY: '', MAIL_FROM: '', SMS_ENABLED: '' }).BREVO_API_KEY,
    ).toBeUndefined();
  });
  it('refuse un expéditeur SMS invalide ou une adresse invalide', () => {
    expect(() => env({ SMS_SENDER: 'New Start!' })).toThrow(/SMS_SENDER/);
    expect(() => env({ MAIL_FROM: 'pas-un-mail' })).toThrow(/MAIL_FROM/);
  });
});
