import type { Mailer, MailMessage } from '../mailer/mailer.js';
import type { SmsMessage, SmsSender } from '../sms/sms.js';

const BASE = 'https://api.brevo.com/v3';
const TIMEOUT_MS = 10_000;

export type BrevoOptions = {
  apiKey: string;
  fetch?: typeof fetch | undefined;
};

/** Appelle Brevo. L'erreur ne contient que le statut : ni corps, ni adresse, ni numéro. */
async function post(o: BrevoOptions, path: string, body: unknown): Promise<string> {
  const res = await (o.fetch ?? fetch)(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'api-key': o.apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Brevo ${path} : réponse ${res.status}`);
  const json = (await res.json()) as { messageId?: unknown };
  return String(json.messageId ?? '');
}

export class BrevoMailer implements Mailer {
  constructor(private readonly o: BrevoOptions & { fromEmail: string; fromName: string }) {}

  async send(m: MailMessage): Promise<{ id: string }> {
    const id = await post(this.o, '/smtp/email', {
      sender: { email: this.o.fromEmail, name: this.o.fromName },
      to: [{ email: m.to }],
      subject: m.subject,
      textContent: m.text,
      ...(m.html ? { htmlContent: m.html } : {}),
    });
    return { id };
  }
}

export class BrevoSmsSender implements SmsSender {
  constructor(private readonly o: BrevoOptions & { sender: string }) {}

  async send(m: SmsMessage): Promise<{ id: string }> {
    const id = await post(this.o, '/transactionalSMS/send', {
      sender: this.o.sender,
      recipient: m.to,
      content: m.text,
      type: 'transactional',
    });
    return { id };
  }
}
