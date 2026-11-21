import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const ensureSession = vi.fn();
const fetchProgress = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./progress-api', () => ({ fetchProgress }));
vi.mock('../../shared/navigation', () => ({ BottomNav: () => <nav>barre du bas</nav> }));
const { ProgressScreen } = await import('./progress-screen');

const t = fr.progress;

beforeEach(() => {
  vi.clearAllMocks();
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  fetchProgress.mockResolvedValue({ xp: 250, level: 3, levelXp: 50, nextLevelXp: 100 });
});
afterEach(cleanup);

describe('ProgressScreen', () => {
  it('affiche le niveau, la barre et l’XP restant', async () => {
    render(<ProgressScreen />);
    expect(await screen.findByText('3')).toBeTruthy();
    const bar = screen.getByRole('progressbar', { name: t.barLabel });
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(screen.getByText('Encore 50 XP pour passer au niveau 4.')).toBeTruthy();
    expect(screen.getByText('250 XP au total')).toBeTruthy();
    expect(fetchProgress).toHaveBeenCalledWith('tok');
  });

  it('renvoie à l’accueil sans session', async () => {
    ensureSession.mockResolvedValue(null);
    render(<ProgressScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(fetchProgress).not.toHaveBeenCalled();
  });

  it('affiche un message quand le chargement échoue', async () => {
    fetchProgress.mockRejectedValue(new Error('x'));
    render(<ProgressScreen />);
    expect((await screen.findByRole('alert')).textContent).toBe(t.error);
  });
});
