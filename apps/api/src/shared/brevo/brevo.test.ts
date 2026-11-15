import { describe, expect, it, vi } from 'vitest';
import { BrevoMailer, BrevoSmsSender } from './brevo.js';

const ok = (messageId: unknown) =>
  vi.fn(async () => new Response(JSON.stringify({ messageId }), { status: 201 }));

describe('BrevoMailer', () => {
  const opts = { apiKey: 'k-test', fromEmail: 'no-reply@test.dev', fromName: 'New Start' };

  it("envoie l'e-mail à /smtp/email avec la clé dans l'en-tête", async () => {
    const f = ok('<abc@brevo>');
    const mailer = new BrevoMailer({ ...opts, fetch: f as unknown as typeof fetch });
    const res = await mailer.send({ to: 'a@test.dev', subject: 'Code', text: '123456' });
    expect(res).toEqual({ id: '<abc@brevo>' });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect((init.headers as Record<string, string>)['api-key']).toBe('k-test');
    expect(JSON.parse(init.body as string)).toEqual({
      sender: { email: 'no-reply@test.dev', name: 'New Start' },
      to: [{ email: 'a@test.dev' }],
      subject: 'Code',
      textContent: '123456',
    });
  });
  it('ajoute le HTML quand il est fourni', async () => {
    const f = ok('1');
    await new BrevoMailer({ ...opts, fetch: f as unknown as typeof fetch }).send({
      to: 'a@test.dev',
      subject: 'S',
      text: 't',
      html: '<p>t</p>',
    });
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(init.body as string).htmlContent).toBe('<p>t</p>');
  });
  it('lève une erreur sans adresse ni corps de réponse quand Brevo refuse', async () => {
    const f = vi.fn(async () => new Response('{"message":"a@test.dev invalide"}', { status: 400 }));
    const mailer = new BrevoMailer({ ...opts, fetch: f as unknown as typeof fetch });
    const err = await mailer.send({ to: 'a@test.dev', subject: 'S', text: 't' }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Brevo /smtp/email : réponse 400');
  });
  it("renvoie un identifiant vide si Brevo n'en donne pas", async () => {
    const f = vi.fn(async () => new Response('{}', { status: 201 }));
    const res = await new BrevoMailer({ ...opts, fetch: f as unknown as typeof fetch }).send({
      to: 'a@test.dev',
      subject: 'S',
      text: 't',
    });
    expect(res.id).toBe('');
  });
});

describe('BrevoSmsSender', () => {
  it('envoie le SMS à /transactionalSMS/send en transactionnel', async () => {
    const f = ok(42);
    const sms = new BrevoSmsSender({
      apiKey: 'k',
      sender: 'NewStart',
      fetch: f as unknown as typeof fetch,
    });
    expect(await sms.send({ to: '+221771234567', text: 'Code 123456' })).toEqual({ id: '42' });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/transactionalSMS/send');
    expect(JSON.parse(init.body as string)).toEqual({
      sender: 'NewStart',
      recipient: '+221771234567',
      content: 'Code 123456',
      type: 'transactional',
    });
  });
});
