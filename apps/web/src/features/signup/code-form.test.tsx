import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSession, setSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { savePendingSignup } from './pending-signup';
import { pending } from './pending-signup.test';

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const api = vi.hoisted(() => ({ requestCode: vi.fn(), verifyCode: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => nav }));
vi.mock('./request-code', () => ({ requestCode: api.requestCode }));
vi.mock('./verify-code', async (orig) => ({
  ...(await orig<typeof import('./verify-code')>()),
  verifyCode: api.verifyCode,
}));
const { CodeForm, RESEND_DELAY_SECONDS } = await import('./code-form');
const { VerifyCodeError } = await import('./verify-code');
const t = fr.code;

beforeEach(() => {
  sessionStorage.clear();
  setSession(null);
  vi.clearAllMocks();
  savePendingSignup(pending);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const type = (value: string) =>
  fireEvent.change(screen.getByLabelText(t.label), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole('button', { name: t.submit }));
const alertText = () => screen.getByRole('alert').textContent;

describe('CodeForm', () => {
  it("renvoie vers l'inscription sans profil en attente", () => {
    sessionStorage.clear();
    const { container } = render(<CodeForm />);
    expect(container.textContent).toBe('');
    expect(nav.replace).toHaveBeenCalledWith('/signup');
  });
  it("garde les chiffres seulement et refuse un code trop court sans appeler l'API", () => {
    render(<CodeForm />);
    expect(screen.getByText(`On l'a envoyé à awa@example.com.`)).toBeTruthy();
    type('12a3');
    expect((screen.getByLabelText(t.label) as HTMLInputElement).value).toBe('123');
    submit();
    expect(alertText()).toBe(t.errors.format);
    expect(api.verifyCode).not.toHaveBeenCalled();
  });
  it('ouvre la session, vide le profil en attente et quitte la page', async () => {
    const session = { accessToken: 'a', expiresInSeconds: 900, user: { id: 'u1' } };
    api.verifyCode.mockResolvedValue(session);
    render(<CodeForm />);
    type('123456');
    submit();
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/'));
    expect(api.verifyCode).toHaveBeenCalledWith('awa@example.com', '123456');
    expect(getSession()).toBe(session);
    expect(sessionStorage.getItem('ns_pending_signup')).toBeNull();
  });
  it.each([
    [400, t.errors.invalid],
    [409, t.errors.conflict],
    [500, t.errors.server],
  ])("explique l'échec %i et laisse réessayer", async (status, text) => {
    api.verifyCode.mockRejectedValue(new VerifyCodeError(status));
    render(<CodeForm />);
    type('123456');
    submit();
    await waitFor(() => expect(alertText()).toBe(text));
    expect(nav.push).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: t.submit }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });
  it('traite une panne réseau comme une erreur serveur', async () => {
    api.verifyCode.mockRejectedValue(new TypeError('offline'));
    render(<CodeForm />);
    type('123456');
    submit();
    await waitFor(() => expect(alertText()).toBe(t.errors.server));
  });
  it('bloque le renvoi 30 secondes, puis renvoie le code avec le profil', async () => {
    vi.useFakeTimers();
    api.requestCode.mockResolvedValue(undefined);
    render(<CodeForm />);
    const resend = () => screen.getByRole('button', { name: /Renvoyer/ }) as HTMLButtonElement;
    expect(resend().textContent).toBe(t.resendIn.replace('{seconds}', '30'));
    expect(resend().disabled).toBe(true);
    for (let i = 0; i < RESEND_DELAY_SECONDS; i++) act(() => vi.advanceTimersByTime(1000));
    expect(resend().textContent).toBe(t.resend);
    await act(async () => resend().click());
    expect(api.requestCode).toHaveBeenCalledWith(pending);
    expect(screen.getByRole('status').textContent).toBe(t.resent);
    expect(resend().disabled).toBe(true);
  });
  it('signale un renvoi raté sans relancer le délai', async () => {
    vi.useFakeTimers();
    api.requestCode.mockRejectedValue(new Error('429'));
    render(<CodeForm />);
    for (let i = 0; i < RESEND_DELAY_SECONDS; i++) act(() => vi.advanceTimersByTime(1000));
    await act(async () => screen.getByRole('button', { name: t.resend }).click());
    expect(alertText()).toBe(t.errors.resend);
    expect((screen.getByRole('button', { name: t.resend }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });
});
