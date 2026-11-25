import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../i18n/fr.json';

const usePathname = vi.fn();
vi.mock('next/navigation', () => ({ usePathname }));
vi.mock('./notifications-bell', () => ({
  NotificationsRailItem: () => (
    <li className="hidden lg:mt-auto lg:flex">
      <a href="/notifications">cloche</a>
    </li>
  ),
}));
const { BottomNav } = await import('./bottom-nav');

afterEach(cleanup);

describe('BottomNav', () => {
  it('propose les cinq onglets vers leurs routes', () => {
    usePathname.mockReturnValue('/chats');
    render(<BottomNav />);
    const nav = screen.getByRole('navigation', { name: fr.nav.label });
    const hrefs = [...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    // La cloche n'apparaît que dans le rail (dès 1024 px), juste avant Profil.
    expect(hrefs).toEqual([
      '/chats',
      '/series',
      '/games',
      '/progress',
      '/notifications',
      '/profile',
    ]);
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

  it('devient un rail à gauche dès 1024 px, avec Profil en bas', () => {
    usePathname.mockReturnValue('/chats');
    render(<BottomNav />);
    const nav = screen.getByRole('navigation', { name: fr.nav.label });
    expect(nav.className).toContain('lg:w-[72px]');
    expect(nav.hasAttribute('data-shell-nav')).toBe(true);
    const items = [...nav.querySelectorAll('li')];
    // Le logo reste en haut ; la cloche prend l'espace libre, Profil la suit en bas.
    expect(items[0]?.className).not.toContain('lg:mt-auto');
    expect(items[items.length - 2]?.className).toContain('lg:mt-auto');
    expect(items[items.length - 1]?.textContent).toBe(fr.nav.profile);
  });

  it('met le logo en haut du rail, caché sur mobile et des lecteurs d’écran', () => {
    usePathname.mockReturnValue('/chats');
    render(<BottomNav />);
    const logo = document.querySelector('img[src="/logo-icon.svg"]');
    expect(logo?.parentElement?.className).toContain('hidden');
    expect(logo?.parentElement?.getAttribute('aria-hidden')).toBe('true');
    expect(logo?.parentElement?.className).toContain('lg:h-16');
    expect(logo?.getAttribute('width')).toBe('44');
  });
});
