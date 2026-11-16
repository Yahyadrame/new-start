import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestCode, RequestCodeError } from './request-code';
import type { SignupFormValues } from './signup-schema';

const values = {
  email: 'awa@example.com',
  firstName: 'Awa',
  phone: '+221771234567',
  goal: 'WORK',
  birthYear: 2000,
  acceptTerms: true,
  smsOptIn: false,
  voiceConsent: false,
} as SignupFormValues;

afterEach(() => vi.unstubAllGlobals());

describe('requestCode', () => {
  it("poste le profil avec l'e-mail comme destination", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await requestCode(values);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/otp/request');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ channel: 'email', destination: 'awa@example.com' });
    expect(body.signup).toMatchObject({ firstName: 'Awa', phone: '+221771234567' });
    expect(body.signup).not.toHaveProperty('email');
  });
  it("lève une erreur avec le statut quand l'API refuse", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(requestCode(values)).rejects.toMatchObject({
      name: 'Error',
      status: 429,
    });
    await expect(requestCode(values)).rejects.toBeInstanceOf(RequestCodeError);
  });
});
