import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { SignupProfile } from '@newstart/shared';
import { FakeMailer, type Mailer } from '../../../shared/mailer/mailer.js';
import { FakeSmsSender } from '../../../shared/sms/sms.js';
import { hashCode } from '../domain/otp.js';
import { RequestOtp, type OtpStore } from './request-otp.js';

const KEY = 'cle-de-test';
const NOW = new Date('2026-11-15T12:00:00Z');

function memoryStore() {
  const rows: (Parameters<OtpStore['create']>[0] & { id: string; createdAt: Date })[] = [];
  const store: OtpStore = {
    countSince: async (destination, since) =>
      rows.filter((r) => r.destination === destination && r.createdAt > since).length,
    create: async (row) => {
      const id = `id-${rows.length + 1}`;
      rows.push({ ...row, id, createdAt: NOW });
      return { id };
    },
    remove: async (id) => {
      rows.splice(
        rows.findIndex((r) => r.id === id),
        1,
      );
    },
  };
  return { store, rows };
}

function setup(opts: { smsEnabled?: boolean; mailer?: Mailer; now?: () => Date } = {}) {
  const { store, rows } = memoryStore();
  const mailer = new FakeMailer();
  const sms = new FakeSmsSender();
  const uc = new RequestOtp(
    store,
    opts.mailer ?? mailer,
    sms,
    KEY,
    opts.smsEnabled ?? false,
    opts.now ?? (() => NOW),
  );
  return { uc, rows, mailer, sms };
}

const codeIn = (text: string) => /\b(\d{6})\b/.exec(text)?.[1] ?? '';

describe('RequestOtp', () => {
  it('envoie un code par e-mail, valable 5 minutes, et ne stocke que son hachage', async () => {
    const { uc, rows, mailer } = setup();
    const res = await uc.execute({ channel: 'email', destination: 'a@test.dev' });
    expect(res).toEqual({ expiresInSeconds: 300 });
    const mail = mailer.lastTo('a@test.dev');
    const code = codeIn(mail?.text ?? '');
    expect(code).toMatch(/^\d{6}$/);
    expect(rows[0]?.codeHash).toBe(hashCode(KEY, 'a@test.dev', code));
    expect(JSON.stringify(rows)).not.toContain(code);
    expect(rows[0]?.expiresAt.getTime()).toBe(NOW.getTime() + 300_000);
  });
  it("garde le profil d'inscription avec le code", async () => {
    const { uc, rows } = setup();
    const signup: SignupProfile = {
      firstName: 'Awa',
      phone: '+221771234567',
      goal: 'WORK',
      goals: ['WORK', 'TRAVEL'],
      interests: ['MUSIC'],
      birthYear: 2000,
      acceptTerms: true,
      smsOptIn: false,
      voiceConsent: false,
    };
    await uc.execute({ channel: 'email', destination: 'a@test.dev', signup });
    expect(rows[0]?.signup).toEqual(signup);
  });
  it('refuse la 4e demande en 10 minutes pour la même destination', async () => {
    const { uc } = setup();
    for (let i = 0; i < 3; i++) await uc.execute({ channel: 'email', destination: 'a@test.dev' });
    await expect(uc.execute({ channel: 'email', destination: 'a@test.dev' })).rejects.toMatchObject(
      {
        status: 429,
        response: { code: 'RATE_LIMITED' },
      },
    );
    await expect(uc.execute({ channel: 'email', destination: 'b@test.dev' })).resolves.toBeTruthy();
  });
  it('refuse le canal SMS tant que les SMS sont éteints, sans rien écrire', async () => {
    const { uc, rows, sms } = setup();
    await expect(
      uc.execute({ channel: 'sms', destination: '+221771234567' }),
    ).rejects.toMatchObject({
      status: 400,
      response: { code: 'CHANNEL_UNAVAILABLE' },
    });
    expect(rows).toHaveLength(0);
    expect(sms.outbox).toHaveLength(0);
  });
  it('envoie un SMS quand le canal est activé', async () => {
    const { uc, sms } = setup({ smsEnabled: true });
    await uc.execute({ channel: 'sms', destination: '+221771234567' });
    expect(codeIn(sms.lastTo('+221771234567')?.text ?? '')).toMatch(/^\d{6}$/);
  });
  it("retire le code et répond 503 si l'envoi échoue", async () => {
    const mailer: Mailer = { send: vi.fn().mockRejectedValue(new Error('Brevo down')) };
    const { uc, rows } = setup({ mailer });
    await expect(uc.execute({ channel: 'email', destination: 'a@test.dev' })).rejects.toMatchObject(
      {
        status: 503,
        response: { code: 'DELIVERY_FAILED' },
      },
    );
    expect(rows).toHaveLength(0);
  });
  it('journalise la cause de l’échec sans l’adresse ni le code', async () => {
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const mailer: Mailer = {
      send: vi.fn().mockRejectedValue(new Error('Brevo /smtp/email : réponse 403')),
    };
    const { uc } = setup({ mailer });
    await expect(
      uc.execute({ channel: 'email', destination: 'secret@test.dev' }),
    ).rejects.toMatchObject({ status: 503 });
    expect(error).toHaveBeenCalledTimes(1);
    const line = String(error.mock.calls[0]?.[0]);
    expect(line).toContain('réponse 403');
    expect(line).not.toContain('secret@test.dev');
    error.mockRestore();
  });
  it('journalise « erreur inconnue » quand l’échec n’est pas une Error', async () => {
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const mailer: Mailer = { send: vi.fn().mockRejectedValue('boum') };
    const { uc } = setup({ mailer });
    await expect(uc.execute({ channel: 'email', destination: 'a@test.dev' })).rejects.toMatchObject(
      { status: 503 },
    );
    expect(String(error.mock.calls[0]?.[0])).toContain('erreur inconnue');
    error.mockRestore();
  });
});
