import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const ensureSession = vi.fn();
const trueFalseQuestions = vi.fn();
const router = { replace };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./games-api', () => ({ trueFalseQuestions }));
vi.mock('../../shared/navigation', () => ({ BottomNav: () => <nav>barre du bas</nav> }));
const { GamesScreen } = await import('./games-screen');

const t = fr.games;
const question = {
  kind: 'TRUE_FALSE',
  expressionId: 1,
  text: 'You know',
  meaningFr: 'tu sais',
  answer: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  trueFalseQuestions.mockResolvedValue([question]);
});
afterEach(cleanup);

describe('GamesScreen', () => {
  it('charge les questions avec le jeton et lance la partie', async () => {
    render(<GamesScreen />);
    expect(await screen.findByText('You know')).toBeTruthy();
    expect(trueFalseQuestions).toHaveBeenCalledWith('tok');
  });

  it('renvoie vers l’accueil sans session', async () => {
    ensureSession.mockResolvedValue(null);
    render(<GamesScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  it('affiche une erreur quand le chargement échoue', async () => {
    trueFalseQuestions.mockRejectedValue(new Error('x'));
    render(<GamesScreen />);
    expect((await screen.findByRole('alert')).textContent).toBe(t.error);
  });

  it('dit qu’il manque des expressions quand l’API ne rend rien', async () => {
    trueFalseQuestions.mockResolvedValue([]);
    render(<GamesScreen />);
    expect(await screen.findByText(t.empty)).toBeTruthy();
  });

  it('recharge des questions en rejouant', async () => {
    render(<GamesScreen />);
    fireEvent.click(await screen.findByRole('button', { name: t.trueFalse.true }));
    fireEvent.click(screen.getByRole('button', { name: t.finish }));
    fireEvent.click(screen.getByRole('button', { name: t.end.replay }));
    await waitFor(() => expect(trueFalseQuestions).toHaveBeenCalledTimes(2));
  });
});
