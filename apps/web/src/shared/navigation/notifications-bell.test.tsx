import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../i18n/fr.json';

const usePathname = vi.fn();
const ensureSession = vi.fn();
const fetchUnreadCount = vi.fn();
vi.mock('next/navigation', () => ({ usePathname }));
vi.mock('../auth/session', () => ({ ensureSession }));
vi.mock('./unread-count', () => ({ fetchUnreadCount }));
const { NotificationsBell, NotificationsRailItem } = await import('./notifications-bell');

beforeEach(() => {
  vi.clearAllMocks();
  usePathname.mockReturnValue('/chats');
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  fetchUnreadCount.mockResolvedValue(0);
});
afterEach(cleanup);

describe('NotificationsBell', () => {
  it('mène à l’écran Notifications, sans point quand tout est lu', async () => {
    render(<NotificationsBell />);
    const link = await screen.findByRole('link', { name: fr.nav.bell });
    expect(link.getAttribute('href')).toBe('/notifications');
    await waitFor(() => expect(fetchUnreadCount).toHaveBeenCalledWith('tok'));
    expect(screen.queryByTestId('unread-dot')).toBeNull();
  });

  it('annonce un non-lu au singulier avec un point', async () => {
    fetchUnreadCount.mockResolvedValue(1);
    render(<NotificationsBell />);
    expect(await screen.findByRole('link', { name: fr.nav.bellUnreadOne })).toBeTruthy();
    expect(screen.getByTestId('unread-dot')).toBeTruthy();
  });

  it('annonce le nombre de non-lus au pluriel', async () => {
    fetchUnreadCount.mockResolvedValue(3);
    render(<NotificationsBell />);
    expect(await screen.findByRole('link', { name: 'Notifications, 3 non lues' })).toBeTruthy();
  });

  it('reste affichée, sans point, quand le compteur ne se charge pas', async () => {
    fetchUnreadCount.mockRejectedValue(new Error('réseau'));
    render(<NotificationsBell />);
    expect(await screen.findByRole('link', { name: fr.nav.bell })).toBeTruthy();
    expect(screen.queryByTestId('unread-dot')).toBeNull();
  });

  it('ne s’affiche pas sans session', async () => {
    ensureSession.mockResolvedValue(null);
    render(<NotificationsBell />);
    await waitFor(() => expect(ensureSession).toHaveBeenCalled());
    expect(screen.queryByRole('link')).toBeNull();
    expect(fetchUnreadCount).not.toHaveBeenCalled();
  });

  it('ne s’affiche pas sur l’écran Notifications lui-même', async () => {
    usePathname.mockReturnValue('/notifications');
    render(<NotificationsBell />);
    await waitFor(() => expect(fetchUnreadCount).toHaveBeenCalled());
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('NotificationsBell dans l’en-tête', () => {
  it('se cache dès 1024 px, où la cloche est dans le rail', async () => {
    render(<NotificationsBell />);
    const link = await screen.findByRole('link', { name: fr.nav.bell });
    expect(link.className).toContain('lg:hidden');
  });
});

describe('NotificationsRailItem', () => {
  const renderRail = () =>
    render(
      <ul>
        <NotificationsRailItem />
      </ul>,
    );

  it('est une entrée du rail, cachée sur mobile, qui prend l’espace libre', async () => {
    renderRail();
    const link = await screen.findByRole('link', { name: fr.nav.bellShort });
    expect(link.getAttribute('href')).toBe('/notifications');
    expect(link.textContent).toBe(fr.nav.bellShort);
    expect(screen.getByRole('listitem').className).toContain('hidden');
    expect(screen.getByRole('listitem').className).toContain('lg:mt-auto');
    expect(link.hasAttribute('aria-current')).toBe(false);
  });

  it('annonce les non-lus avec un point', async () => {
    fetchUnreadCount.mockResolvedValue(2);
    renderRail();
    // Le nom commence par le texte visible, comme l'exige l'accessibilité.
    expect(await screen.findByRole('link', { name: 'Notifs, 2 non lues' })).toBeTruthy();
    expect(screen.getByTestId('unread-dot')).toBeTruthy();
  });

  it('marque l’entrée active sur l’écran Notifications', async () => {
    usePathname.mockReturnValue('/notifications');
    renderRail();
    const link = await screen.findByRole('link');
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it('annonce un non-lu au singulier', async () => {
    fetchUnreadCount.mockResolvedValue(1);
    renderRail();
    expect(await screen.findByRole('link', { name: 'Notifs, 1 non lue' })).toBeTruthy();
  });
});
