import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const ensureSession = vi.fn();
const trueFalseQuestions = vi.fn();
const matchQuestions = vi.fn();
const sendMissed = vi.fn();
const sendResult = vi.fn();
const fetchStreak = vi.fn();
const router = { replace };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./games-api', () => ({
  trueFalseQuestions,
  matchQuestions,
  sendMissed,
  sendResult,
  fetchStreak,
}));
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
  sendMissed.mockResolvedValue(undefined);
  sendResult.mockResolvedValue(0);
  fetchStreak.mockResolvedValue(0);
  trueFalseQuestions.mockResolvedValue([question]);
});
afterEach(cleanup);

describe('GamesScreen', () => {
  it('liste les jeux à venir avec leur badge « Bientôt »', async () => {
    render(<GamesScreen />);
    await screen.findByText('You know');
    expect(screen.getByRole('heading', { level: 2, name: t.upcoming.title })).toBeTruthy();
    for (const game of t.upcoming.items) expect(screen.getByText(game.name)).toBeTruthy();
    const cards = within(screen.getByRole('region', { name: t.upcoming.title })).getAllByRole(
      'listitem',
    );
    expect(cards).toHaveLength(t.upcoming.items.length);
    for (const card of cards) expect(within(card).getByText(t.upcoming.badge)).toBeTruthy();
  });

  it('montre la série de jours', async () => {
    fetchStreak.mockResolvedValue(4);
    render(<GamesScreen />);
    expect(await screen.findByText(t.streak.replace('{n}', '4'))).toBeTruthy();
  });

  it('invite à démarrer une série quand elle est à zéro', async () => {
    render(<GamesScreen />);
    expect(await screen.findByText(t.noStreak)).toBeTruthy();
  });

  it('cache la ligne quand la série ne se charge pas', async () => {
    fetchStreak.mockRejectedValue(new Error('x'));
    render(<GamesScreen />);
    await screen.findByText('You know');
    expect(screen.queryByText(t.noStreak)).toBeNull();
  });

  it('affiche l’XP gagné à la fin de la partie', async () => {
    sendResult.mockResolvedValue(5);
    render(<GamesScreen />);
    await screen.findByText('You know');
    fireEvent.click(screen.getByRole('button', { name: t.trueFalse.true }));
    fireEvent.click(screen.getByRole('button', { name: t.finish }));
    expect(await screen.findByText('+5 XP')).toBeTruthy();
    expect(sendResult).toHaveBeenCalledWith('tok', 1);
  });

  it('n’affiche pas d’XP quand l’envoi échoue', async () => {
    sendResult.mockRejectedValue(new Error('x'));
    render(<GamesScreen />);
    await screen.findByText('You know');
    fireEvent.click(screen.getByRole('button', { name: t.trueFalse.true }));
    fireEvent.click(screen.getByRole('button', { name: t.finish }));
    await waitFor(() => expect(sendResult).toHaveBeenCalled());
    expect(screen.queryByText(/XP/)).toBeNull();
  });

  it('demande vingt questions pour le contre-la-montre', async () => {
    render(<GamesScreen />);
    await screen.findByText('You know');
    fireEvent.mouseDown(screen.getByRole('tab', { name: t.modes.timeAttack }), { button: 0 });
    expect(await screen.findByText('Combo x1')).toBeTruthy();
    expect(trueFalseQuestions).toHaveBeenLastCalledWith('tok', 20);
  });

  it('envoie les expressions ratées à la fin de la partie, sans bloquer si l’envoi échoue', async () => {
    sendMissed.mockRejectedValue(new Error('x'));
    render(<GamesScreen />);
    await screen.findByText('You know');
    fireEvent.click(screen.getByRole('button', { name: t.trueFalse.false }));
    fireEvent.click(screen.getByRole('button', { name: t.finish }));
    await waitFor(() => expect(sendMissed).toHaveBeenCalledWith('tok', [1]));
    expect(screen.getByText(t.end.title)).toBeTruthy();
  });

  it('charge les tableaux Associer en changeant d’onglet', async () => {
    matchQuestions.mockResolvedValue([
      {
        kind: 'MATCH',
        pairs: [{ expressionId: 1, text: 'No way' }],
        meanings: [{ expressionId: 1, meaningFr: 'impossible' }],
      },
    ]);
    render(<GamesScreen />);
    await screen.findByText('You know');
    fireEvent.mouseDown(screen.getByRole('tab', { name: t.modes.match }), { button: 0 });
    expect(await screen.findByText(t.match.hint)).toBeTruthy();
    expect(matchQuestions).toHaveBeenCalledWith('tok', undefined);
  });

  it('charge les questions avec le jeton et lance la partie', async () => {
    render(<GamesScreen />);
    expect(await screen.findByText('You know')).toBeTruthy();
    expect(trueFalseQuestions).toHaveBeenCalledWith('tok', undefined);
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
