import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const push = vi.hoisted(() => vi.fn());
const requestCode = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('./request-code', () => ({ requestCode }));
const { SignupForm } = await import('./signup-form');
const { loadPendingSignup } = await import('./pending-signup');
const t = fr.signup;

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
function fillAll() {
  fill(t.firstName, 'Awa');
  fill(t.phone, '77 123 45 67');
  fill(t.birthYear, '2000');
  fill(t.email, 'awa@example.com');
  fireEvent.click(screen.getByLabelText(t.goals.WORK.label, { exact: false }));
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
    expect((screen.getByLabelText(t.smsOptIn) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText(t.voiceConsent) as HTMLInputElement).checked).toBe(false);
  });
  it('affiche les erreurs en français sans appeler l’API', async () => {
    render(<SignupForm />);
    submit();
    expect(await screen.findByText(t.errors.firstName)).toBeTruthy();
    expect(screen.getByText(t.errors.phone)).toBeTruthy();
    expect(screen.getByText(t.errors.goal)).toBeTruthy();
    expect(screen.getByText(t.errors.acceptTerms)).toBeTruthy();
    expect(requestCode).not.toHaveBeenCalled();
  });
  it('envoie le profil nettoyé puis passe au code', async () => {
    requestCode.mockResolvedValue(undefined);
    render(<SignupForm />);
    fillAll();
    submit();
    await waitFor(() => expect(push).toHaveBeenCalledWith('/signup/code'));
    expect(loadPendingSignup()?.email).toBe('awa@example.com');
    expect(requestCode).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+221771234567', birthYear: 2000, goal: 'WORK' }),
    );
  });
  it('garde la saisie et prévient quand l’envoi échoue', async () => {
    requestCode.mockRejectedValue(new Error('réseau'));
    render(<SignupForm />);
    fillAll();
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
  it('refuse l’envoi tant qu’aucune année n’est choisie', async () => {
    render(<SignupForm />);
    submit();
    expect(await screen.findByText(t.errors.birthYear)).toBeTruthy();
  });

  it('renvoie vers les conditions et la politique de confidentialité', () => {
    render(<SignupForm />);
    expect(screen.getByRole('link', { name: fr.signup.termsLink }).getAttribute('href')).toBe(
      '/terms',
    );
    expect(screen.getByRole('link', { name: fr.signup.privacyLink }).getAttribute('href')).toBe(
      '/privacy',
    );
  });
});
