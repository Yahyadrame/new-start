import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const ensureSession = vi.fn();
const fetchNotifications = vi.fn();
const markAllRead = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./notifications-api', () => ({ fetchNotifications, markAllRead }));
vi.mock('../../shared/navigation', () => ({ BottomNav: () => <nav>barre du bas</nav> }));
const { NotificationsScreen } = await import('./notifications-screen');

const t = fr.notifications;
const item = (id: string, createdAt: Date, over: Record<string, unknown> = {}) => ({
  id,
  kind: 'reminder',
  title: `Rappel ${id}`,
  body: 'Quelques minutes d’anglais ?',
  createdAt: createdAt.toISOString(),
  read: false,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  markAllRead.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('NotificationsScreen', () => {
  it('range les rappels sous « Aujourd’hui » et « Cette semaine »', async () => {
    const day = 24 * 60 * 60 * 1000;
    fetchNotifications.mockResolvedValue([
      item('a', new Date()),
      item('b', new Date(Date.now() - 3 * day), { read: true }),
    ]);
    render(<NotificationsScreen />);
    expect(await screen.findByText('Rappel a')).toBeTruthy();
    expect(screen.getByRole('heading', { name: t.today })).toBeTruthy();
    expect(screen.getByRole('heading', { name: t.week })).toBeTruthy();
    expect(screen.getByText('Rappel b')).toBeTruthy();
    expect(fetchNotifications).toHaveBeenCalledWith('tok');
  });

  it('marque tout comme lu après l’affichage, sans bloquer si ça échoue', async () => {
    markAllRead.mockRejectedValue(new Error('x'));
    fetchNotifications.mockResolvedValue([item('a', new Date())]);
    render(<NotificationsScreen />);
    expect(await screen.findByText('Rappel a')).toBeTruthy();
    await waitFor(() => expect(markAllRead).toHaveBeenCalledWith('tok'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('n’affiche pas un groupe vide', async () => {
    fetchNotifications.mockResolvedValue([item('a', new Date())]);
    render(<NotificationsScreen />);
    await screen.findByText('Rappel a');
    expect(screen.queryByRole('heading', { name: t.week })).toBeNull();
  });

  it('dit simplement qu’il n’y a rien quand la liste est vide', async () => {
    fetchNotifications.mockResolvedValue([]);
    render(<NotificationsScreen />);
    expect(await screen.findByText(t.empty)).toBeTruthy();
  });

  it('signale l’erreur de chargement', async () => {
    fetchNotifications.mockRejectedValue(new Error('x'));
    render(<NotificationsScreen />);
    expect((await screen.findByRole('alert')).textContent).toBe(t.error);
  });

  it('renvoie à l’accueil sans session', async () => {
    ensureSession.mockResolvedValue(null);
    render(<NotificationsScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(fetchNotifications).not.toHaveBeenCalled();
  });
});
