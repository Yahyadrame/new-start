import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

afterEach(cleanup);
vi.mock('../../shared/navigation', () => ({
  BottomNav: () => <nav aria-label="Navigation principale">barre du bas</nav>,
  NotificationsBell: () => <span>cloche</span>,
}));
const { ComingSoonScreen } = await import('./coming-soon-screen');

describe('ComingSoonScreen', () => {
  it('montre le titre, la mention « Bientôt » et un retour vers les discussions', () => {
    render(<ComingSoonScreen title="Série" />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Série');
    expect(screen.getByText(fr.comingSoon.badge)).toBeTruthy();
    expect(screen.getByRole('link', { name: fr.comingSoon.toChats }).getAttribute('href')).toBe(
      '/chats',
    );
  });

  it('garde la barre d’onglets du bas', () => {
    render(<ComingSoonScreen title="Série" />);
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeTruthy();
  });

  it('met la cloche des notifications dans l’en-tête', () => {
    render(<ComingSoonScreen title="Série" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.parentElement?.textContent).toContain('cloche');
  });
});
