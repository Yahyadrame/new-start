import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../i18n/fr.json';

const usePathname = vi.fn();
vi.mock('next/navigation', () => ({ usePathname }));
vi.mock('./notifications-bell', () => ({
  NotificationsBell: () => <a href="/notifications">cloche</a>,
}));
const { BottomNav } = await import('./bottom-nav');

afterEach(cleanup);

describe('BottomNav', () => {
  it('propose les cinq onglets vers leurs routes', () => {
    usePathname.mockReturnValue('/chats');
    render(<BottomNav />);
    const nav = screen.getByRole('navigation', { name: fr.nav.label });
    const hrefs = [...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/chats', '/series', '/games', '/progress', '/profile']);
  });

  it("marque l'onglet de la page courante", () => {
    usePathname.mockReturnValue('/chats');
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: fr.nav.chats }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(
      screen.getByRole('link', { name: fr.nav.games }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it("garde l'onglet Discussions actif dans une sous-page", () => {
    usePathname.mockReturnValue('/chats/jade');
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: fr.nav.chats }).getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it("marque l'onglet Profil sur la page du profil", () => {
    usePathname.mockReturnValue('/profile');
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: fr.nav.profile }).getAttribute('aria-current')).toBe(
      'page',
    );
  });
});
