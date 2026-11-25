import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const push = vi.hoisted(() => vi.fn());
const requestCode = vi.hoisted(() => vi.fn());
const signInWithGoogle = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('./request-code', () => ({ requestCode }));
vi.mock('../../shared/auth/google-api', async (orig) => ({
  ...(await orig<typeof import('../../shared/auth/google-api')>()),
  signInWithGoogle,
}));
const { SignupForm } = await import('./signup-form');
const { loadPendingSignup } = await import('./pending-signup');
const t = fr.signup;

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
const next = () => fireEvent.click(screen.getByRole('button', { name: t.next }));
// Le nom accessible d'une carte contient aussi son aide : on cherche par le début.
const chip = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}`) }));
async function identity() {
  fill(t.firstName, 'Awa');
  fill(t.phone, '77 123 45 67');
  fill(t.birthYear, '2000');
  fill(t.email, 'awa@example.com');
  next();
  await screen.findByText(t.titles.goals);
}
/** Mène la personne jusqu'à la dernière étape, avec un objectif et un centre d'intérêt. */
async function fillAll() {
  await identity();
  chip(t.goals.WORK.label);
  chip(t.goals.TRAVEL.label);
  next();
  await screen.findByText(t.titles.interests);
  chip(t.interests.MUSIC);
  next();
  await screen.findByText(t.titles.consent);
  fireEvent.click(screen.getByLabelText(t.acceptTerms));
}
const submit = () => fireEvent.click(screen.getByRole('button', { name: t.submit }));

beforeEach(() => {
  sessionStorage.clear();
  requestCode.mockReset();
  push.mockReset();
});
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(cleanup);

describe('SignupForm', () => {
  it('laisse les SMS et la voix décochés par défaut', () => {
    render(<SignupForm />);
    expect(
      (screen.getByLabelText(t.smsOptIn, { selector: 'input' }) as HTMLInputElement).checked,
    ).toBe(false);
    expect(
      (screen.getByLabelText(t.voiceConsent, { selector: 'input' }) as HTMLInputElement).checked,
    ).toBe(false);
  });
  it('bloque la première étape et dit pourquoi, sans appeler l’API', async () => {
    render(<SignupForm />);
    next();
    expect(await screen.findByText(t.errors.firstName)).toBeTruthy();
    expect(screen.getByText(t.errors.phone)).toBeTruthy();
    expect(screen.getByText(t.errors.birthYear)).toBeTruthy();
    expect(screen.getByText(t.errors.email)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(t.titles.identity);
    expect(requestCode).not.toHaveBeenCalled();
  });
  it('demande au moins un objectif avant d’avancer', async () => {
    render(<SignupForm />);
    await identity();
    next();
    expect(await screen.findByText(t.errors.goal)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(t.titles.goals);
  });
  it('refuse l’envoi sans les conditions', async () => {
    render(<SignupForm />);
    await fillAll();
    fireEvent.click(screen.getByLabelText(t.acceptTerms));
    submit();
    expect(await screen.findByText(t.errors.acceptTerms)).toBeTruthy();
    expect(requestCode).not.toHaveBeenCalled();
  });
  it('envoie le profil avec tous les choix, le premier objectif devenant le principal', async () => {
    requestCode.mockResolvedValue(undefined);
    render(<SignupForm />);
    await fillAll();
    submit();
    await waitFor(() => expect(push).toHaveBeenCalledWith('/signup/code'));
    expect(loadPendingSignup()?.email).toBe('awa@example.com');
    expect(requestCode).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+221771234567',
        birthYear: 2000,
        goal: 'WORK',
        goals: ['WORK', 'TRAVEL'],
        interests: ['MUSIC'],
      }),
    );
  });
  it('laisse passer l’étape des centres d’intérêt', async () => {
    requestCode.mockResolvedValue(undefined);
    render(<SignupForm />);
    await identity();
    chip(t.goals.FRIENDS.label);
    next();
    await screen.findByText(t.titles.interests);
    fireEvent.click(screen.getByRole('button', { name: t.skip }));
    fireEvent.click(await screen.findByLabelText(t.acceptTerms));
    submit();
    await waitFor(() => expect(requestCode).toHaveBeenCalled());
    expect(requestCode).toHaveBeenCalledWith(
      expect.objectContaining({ goal: 'FRIENDS', interests: [] }),
    );
  });
  it('revient en arrière sans rien perdre, puis ramène à l’accueil depuis la première étape', async () => {
    render(<SignupForm />);
    await identity();
    fireEvent.click(screen.getByRole('button', { name: t.back }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(t.titles.identity);
    expect((screen.getByLabelText(t.firstName) as HTMLInputElement).value).toBe('Awa');
    expect(screen.getByRole('link', { name: t.back }).getAttribute('href')).toBe('/');
  });
  it('indique l’étape en cours', async () => {
    render(<SignupForm />);
    expect(screen.getByRole('img', { name: 'Étape 1 sur 4' })).toBeTruthy();
    await identity();
    expect(screen.getByRole('img', { name: 'Étape 2 sur 4' })).toBeTruthy();
  });
  it('garde la saisie et prévient quand l’envoi échoue', async () => {
    requestCode.mockRejectedValue(new Error('réseau'));
    render(<SignupForm />);
    await fillAll();
    submit();
    expect(await screen.findByText(t.errors.server)).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    expect(loadPendingSignup()).toBeNull();
    expect((screen.getByLabelText(t.firstName) as HTMLInputElement).value).toBe('Awa');
  });
});

describe('SignupForm : choix guidés', () => {
  it('propose l’année de naissance en liste, de 13 à 100 ans', () => {
    render(<SignupForm />);
    const options = Array.from(
      (screen.getByLabelText(t.birthYear) as HTMLSelectElement).options,
    ).slice(1);
    const year = new Date().getFullYear();
    expect(options[0]?.value).toBe(String(year - 13));
    expect(options.at(-1)?.value).toBe(String(year - 100));
  });
  it('renvoie vers les conditions et la politique de confidentialité', async () => {
    render(<SignupForm />);
    await fillAll();
    expect(screen.getByRole('link', { name: fr.signup.termsLink }).getAttribute('href')).toBe(
      '/terms',
    );
    expect(screen.getByRole('link', { name: fr.signup.privacyLink }).getAttribute('href')).toBe(
      '/privacy',
    );
  });
  it('crée le compte avec Google à partir du profil saisi', async () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'cid');
    const initialize = vi.fn();
    (window as unknown as { google: unknown }).google = {
      accounts: {
        id: {
          initialize,
          renderButton: vi.fn(),
        },
      },
    };
    signInWithGoogle.mockResolvedValue({ accessToken: 'a' });
    render(<SignupForm />);
    await fillAll();
    await waitFor(() => expect(screen.getByTestId('google-button')).toBeTruthy());
    await waitFor(() => expect(initialize).toHaveBeenCalled());
    await initialize.mock.calls[0]?.[0].callback({ credential: 'tok' });
    expect(signInWithGoogle).toHaveBeenCalledWith(
      'tok',
      expect.objectContaining({ firstName: 'Awa', acceptTerms: true }),
    );
    expect(push).toHaveBeenCalledWith('/onboarding/level');
    vi.unstubAllEnvs();
    delete (window as unknown as { google?: unknown }).google;
  });
});
