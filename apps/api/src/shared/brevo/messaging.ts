import type { Env } from '../../config/env.js';
import { FakeMailer, type Mailer } from '../mailer/mailer.js';
import { FakeSmsSender, type SmsSender } from '../sms/sms.js';
import { BrevoMailer, BrevoSmsSender } from './brevo.js';

/** Sans clé Brevo (ou sans adresse d'expédition), les e-mails restent en mémoire. */
export function createMailer(env: Env, fetchImpl?: typeof fetch): Mailer {
  if (!env.BREVO_API_KEY || !env.MAIL_FROM) return new FakeMailer();
  return new BrevoMailer({
    apiKey: env.BREVO_API_KEY,
    fromEmail: env.MAIL_FROM,
    fromName: env.MAIL_FROM_NAME,
    fetch: fetchImpl,
  });
}

/** Les SMS restent factices tant que `SMS_ENABLED` n'est pas à true (budget à accorder par le porteur). */
export function createSmsSender(env: Env, fetchImpl?: typeof fetch): SmsSender {
  if (!env.SMS_ENABLED || !env.BREVO_API_KEY) return new FakeSmsSender();
  return new BrevoSmsSender({
    apiKey: env.BREVO_API_KEY,
    sender: env.SMS_SENDER,
    fetch: fetchImpl,
  });
}
