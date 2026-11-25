import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { summarize } from '@newstart/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const ensureSession = vi.fn();
const fetchProgress = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./progress-api', () => ({ fetchProgress }));
vi.mock('../../shared/navigation', () => ({
  BottomNav: () => <nav>barre du bas</nav>,
  NotificationsBell: () => <span>cloche</span>,
}));
const { ProgressScreen } = await import('./progress-screen');

const t = fr.progress;

beforeEach(() => {
  vi.clearAllMocks();
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  fetchProgress.mockResolvedValue(summarize(250, 6, [], '2026-11-21'));
});
afterEach(cleanup);

describe('ProgressScreen', () => {
  it('met la cloche des notifications dans l’en-tête, à côté du titre', async () => {
    render(<ProgressScreen />);
    await screen.findByText('3');
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.parentElement?.tagName).toBe('HEADER');
    expect(heading.parentElement?.textContent).toContain('cloche');
  });

  it('affiche le niveau, la barre et l’XP restant', async () => {
    render(<ProgressScreen />);
    expect(await screen.findByText('3')).toBeTruthy();
    const bar = screen.getByRole('progressbar', { name: t.barLabel });
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(screen.getByText('Encore 50 XP pour passer au niveau 4.')).toBeTruthy();
    expect(screen.getByText(t.totalLabel)).toBeTruthy();
    expect(screen.getByText('250')).toBeTruthy();
    expect(screen.getByText(t.streakLabel)).toBeTruthy();
    expect(screen.getByText('6 jours')).toBeTruthy();
    expect(screen.getByText(t.figuresTitle)).toBeTruthy();
    expect(fetchProgress).toHaveBeenCalledWith('tok');
  });

  it('invite à démarrer une série quand elle est à 0', async () => {
    fetchProgress.mockResolvedValue(summarize(0, 0, [], '2026-11-21'));
    render(<ProgressScreen />);
    expect(await screen.findByText(t.noStreak)).toBeTruthy();
    expect(screen.getByText('0 jour')).toBeTruthy();
  });

  it('présente les chiffres en cartes arrondies, comme les maquettes', async () => {
    render(<ProgressScreen />);
    const card = (await screen.findByText(t.streakLabel)).closest('section');
    expect(card?.className).toContain('rounded-3xl');
    expect(card?.className).toContain('border-line');
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
