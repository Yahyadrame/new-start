import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const ensureSession = vi.fn();
const getMe = vi.fn();
const patchMe = vi.fn();
// Un objet stable, comme le routeur de Next : sinon l'effet de chargement repart à chaque rendu.
const router = { replace };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./profile-api', () => ({ getMe, patchMe }));
const { ProfileScreen } = await import('./profile-screen');

const t = fr.profile;
const me = {
  id: 'u',
  firstName: 'Awa',
  goal: 'WORK',
  level: 'B1',
  theme: 'SYSTEM',
  reminderTime: null,
  timezone: 'Africa/Dakar',
  dailyGoalMin: 15,
  preferredAccent: 'en-US',
  dataSaver: false,
  pausedUntil: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  getMe.mockResolvedValue(me);
  patchMe.mockImplementation(async (_token: string, patch: object) => ({ ...me, ...patch }));
});
afterEach(cleanup);

const open = async () => {
  render(<ProfileScreen />);
  await screen.findByText('Awa');
};

describe('ProfileScreen', () => {
  it('renvoie vers l’accueil sans session', async () => {
    ensureSession.mockResolvedValue(null);
    render(<ProfileScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(getMe).not.toHaveBeenCalled();
  });

  it('montre le prénom, le niveau et les réglages du compte', async () => {
    await open();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(t.title);
    expect(screen.getByText('Niveau B1')).toBeTruthy();
    expect((screen.getByLabelText(t.learning.dailyGoal) as HTMLSelectElement).value).toBe('15');
    expect((screen.getByLabelText(t.learning.accent) as HTMLSelectElement).value).toBe('en-US');
    expect(
      screen.getByRole('switch', { name: t.reminders.reminder }).getAttribute('aria-checked'),
    ).toBe('false');
    expect(screen.queryByLabelText(t.reminders.reminderTime)).toBeNull();
  });

  it('applique le thème du compte dès le chargement', async () => {
    getMe.mockResolvedValue({ ...me, theme: 'DARK' });
    await open();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(window.localStorage.getItem('ns-theme')).toBe('dark');
  });

  it('change le thème tout de suite et l’enregistre sur le compte', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: fr.theme.dark }));
    expect(document.documentElement.dataset['theme']).toBe('dark');
    await waitFor(() => expect(patchMe).toHaveBeenCalledWith('tok', { theme: 'DARK' }));
  });

  it('enregistre l’objectif quotidien et l’accent', async () => {
    await open();
    fireEvent.change(screen.getByLabelText(t.learning.dailyGoal), { target: { value: '30' } });
    await waitFor(() => expect(patchMe).toHaveBeenCalledWith('tok', { dailyGoalMin: 30 }));
    fireEvent.change(screen.getByLabelText(t.learning.accent), { target: { value: 'en-GB' } });
    await waitFor(() => expect(patchMe).toHaveBeenCalledWith('tok', { preferredAccent: 'en-GB' }));
  });

  it('active le rappel à 19:00, puis change l’heure', async () => {
    await open();
    fireEvent.click(screen.getByRole('switch', { name: t.reminders.reminder }));
    await waitFor(() => expect(patchMe).toHaveBeenCalledWith('tok', { reminderTime: '19:00' }));
    fireEvent.change(await screen.findByLabelText(t.reminders.reminderTime), {
      target: { value: '07:30' },
    });
    await waitFor(() => expect(patchMe).toHaveBeenCalledWith('tok', { reminderTime: '07:30' }));
  });

  it('désactive le rappel', async () => {
    getMe.mockResolvedValue({ ...me, reminderTime: '19:00' });
    await open();
    fireEvent.click(screen.getByRole('switch', { name: t.reminders.reminder }));
    await waitFor(() => expect(patchMe).toHaveBeenCalledWith('tok', { reminderTime: null }));
  });

  it('active l’économie de données', async () => {
    await open();
    fireEvent.click(screen.getByRole('switch', { name: t.data.saver }));
    await waitFor(() => expect(patchMe).toHaveBeenCalledWith('tok', { dataSaver: true }));
  });

  it('met en pause pour une semaine, laisse choisir la reprise, puis lève la pause', async () => {
    await open();
    fireEvent.click(screen.getByRole('switch', { name: t.reminders.pause }));
    await waitFor(() => expect(patchMe).toHaveBeenCalledTimes(1));
    const until = new Date(patchMe.mock.calls[0]?.[1].pausedUntil).getTime() - Date.now();
    expect(Math.round(until / 86_400_000)).toBe(7);

    fireEvent.change(await screen.findByLabelText(t.reminders.pauseUntil), {
      target: { value: '2999-01-02' },
    });
    await waitFor(() => expect(patchMe).toHaveBeenCalledTimes(2));
    expect(new Date(patchMe.mock.calls[1]?.[1].pausedUntil).getFullYear()).toBe(2999);

    fireEvent.click(screen.getByRole('switch', { name: t.reminders.pause }));
    await waitFor(() => expect(patchMe).toHaveBeenLastCalledWith('tok', { pausedUntil: null }));
  });

  it('une pause déjà terminée compte comme désactivée', async () => {
    getMe.mockResolvedValue({ ...me, pausedUntil: '2020-01-01T00:00:00.000Z' });
    await open();
    expect(
      screen.getByRole('switch', { name: t.reminders.pause }).getAttribute('aria-checked'),
    ).toBe('false');
  });

  it('remet l’ancienne valeur et prévient quand l’enregistrement échoue', async () => {
    patchMe.mockRejectedValue(new Error('500'));
    await open();
    fireEvent.click(screen.getByRole('switch', { name: t.data.saver }));
    expect((await screen.findByRole('alert')).textContent).toBe(t.errors.save);
    expect(screen.getByRole('switch', { name: t.data.saver }).getAttribute('aria-checked')).toBe(
      'false',
    );
  });

  it('prévient quand les réglages ne se chargent pas', async () => {
    getMe.mockRejectedValue(new Error('500'));
    render(<ProfileScreen />);
    expect((await screen.findByRole('alert')).textContent).toBe(t.errors.load);
  });

  it('garde un objectif atypique dans la liste', async () => {
    getMe.mockResolvedValue({ ...me, dailyGoalMin: 25 });
    await open();
    expect((screen.getByLabelText(t.learning.dailyGoal) as HTMLSelectElement).value).toBe('25');
  });
});
