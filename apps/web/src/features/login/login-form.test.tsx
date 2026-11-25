import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSession, setSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';

const nav = vi.hoisted(() => ({ push: vi.fn() }));
const api = vi.hoisted(() => ({ requestLoginCode: vi.fn(), verifyLoginCode: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => nav }));
vi.mock('./login-api', async (orig) => ({
  ...(await orig<typeof import('./login-api')>()),
  ...api,
}));
const { LoginForm } = await import('./login-form');
const { LoginError } = await import('./login-api');
const t = fr.login;

beforeEach(() => {
  vi.clearAllMocks();
  setSession(null);
});
afterEach(cleanup);

const typeEmail = (value: string) =>
  fireEvent.change(screen.getByLabelText(t.email), { target: { value } });
const typeCode = (value: string) =>
  fireEvent.change(screen.getByLabelText(t.code), { target: { value } });
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const alertText = () => screen.getByRole('alert').textContent;

async function toCodeStep() {
  api.requestLoginCode.mockResolvedValue(undefined);
  render(<LoginForm />);
  typeEmail(' awa@example.com ');
  click(t.sendCode);
  await screen.findByLabelText(t.code);
}

describe('LoginForm, étape e-mail', () => {
  it("refuse une adresse invalide sans appeler l'API", () => {
    render(<LoginForm />);
    typeEmail('awa');
    click(t.sendCode);
    expect(alertText()).toBe(t.errors.email);
    expect(api.requestLoginCode).not.toHaveBeenCalled();
  });
  it("demande le code avec l'adresse nettoyée, puis passe à l'étape du code", async () => {
    await toCodeStep();
    expect(api.requestLoginCode).toHaveBeenCalledWith('awa@example.com');
    expect(screen.getByText("On l'a envoyé à awa@example.com.")).toBeTruthy();
  });
  it.each([
    [429, t.errors.rateLimited],
    [500, t.errors.server],
  ])('affiche le message quand l’API répond %i', async (status, text) => {
    api.requestLoginCode.mockRejectedValue(new LoginError(status));
    render(<LoginForm />);
    typeEmail('awa@example.com');
    click(t.sendCode);
    await waitFor(() => expect(alertText()).toBe(text));
  });
});

describe('LoginForm, étape du code', () => {
  it("garde les chiffres et refuse un code trop court sans appeler l'API", async () => {
    await toCodeStep();
    typeCode('12a3');
    expect((screen.getByLabelText(t.code) as HTMLInputElement).value).toBe('123');
    click(t.submit);
    expect(alertText()).toBe(t.errors.format);
    expect(api.verifyLoginCode).not.toHaveBeenCalled();
  });
  it('ouvre la session et mène aux discussions', async () => {
    await toCodeStep();
    api.verifyLoginCode.mockResolvedValue({ accessToken: 'tok' });
    typeCode('123456');
    click(t.submit);
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/chats'));
    expect(api.verifyLoginCode).toHaveBeenCalledWith('awa@example.com', '123456');
    expect(getSession()).toEqual({ accessToken: 'tok' });
  });
  it.each([
    [400, t.errors.invalid],
    [404, t.errors.notFound],
    [0, t.errors.server],
  ])('affiche le message quand la vérification échoue (%i)', async (status, text) => {
    await toCodeStep();
    api.verifyLoginCode.mockRejectedValue(status ? new LoginError(status) : new Error('réseau'));
    typeCode('123456');
    click(t.submit);
    await waitFor(() => expect(alertText()).toBe(text));
    expect(nav.push).not.toHaveBeenCalled();
  });
  it("revient à l'étape de l'e-mail pour changer d'adresse", async () => {
    await toCodeStep();
    click(t.changeEmail);
    expect(screen.getByLabelText(t.email)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('LoginForm, Google', () => {
  it('propose de créer le compte quand Google ne trouve aucun compte', async () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'cid');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }),
    );
    let callback: (r: { credential: string }) => Promise<void> = async () => {};
    (window as unknown as { google: unknown }).google = {
      accounts: {
        id: {
          initialize: (o: { callback: typeof callback }) => (callback = o.callback),
          renderButton: vi.fn(),
        },
      },
    };
    render(<LoginForm />);
    await waitFor(() => expect(screen.getByTestId('google-button')).toBeTruthy());
    await callback({ credential: 'tok' });
    const link = await screen.findByRole('link', { name: t.signupLink });
    expect(link.getAttribute('href')).toBe('/signup');
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    delete (window as unknown as { google?: unknown }).google;
  });
});
