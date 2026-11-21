import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const ensureSession = vi.fn();
const fetchDaily = vi.fn();
const sendDailyResult = vi.fn();
const sendMissed = vi.fn();
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./games-api', () => ({ fetchDaily, sendDailyResult, sendMissed }));
const { DailyChallenge } = await import('./daily-challenge');

const t = fr.games.daily;
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
  sendDailyResult.mockResolvedValue({ gained: 25, bonus: 20 });
  fetchDaily.mockResolvedValue({ done: false, questions: [question] });
});
afterEach(cleanup);

describe('DailyChallenge', () => {
  it('propose de jouer le défi tant qu’il n’est pas fait', async () => {
    render(<DailyChallenge />);
    expect(await screen.findByRole('button', { name: t.play })).toBeTruthy();
    expect(screen.getByText(t.intro)).toBeTruthy();
    expect(screen.queryByText(t.done)).toBeNull();
  });

  it('marque le défi comme terminé et propose de le rejouer', async () => {
    fetchDaily.mockResolvedValue({ done: true, questions: [question] });
    render(<DailyChallenge />);
    expect(await screen.findByText(t.done)).toBeTruthy();
    expect(screen.getByText(t.doneHint)).toBeTruthy();
    expect(screen.getByRole('button', { name: t.replay })).toBeTruthy();
  });

  it('ne montre rien sans question', async () => {
    fetchDaily.mockResolvedValue({ done: false, questions: [] });
    const { container } = render(<DailyChallenge />);
    await waitFor(() => expect(fetchDaily).toHaveBeenCalled());
    await waitFor(() => expect(container.querySelector('section')).toBeNull());
  });

  it('affiche une erreur si le défi ne charge pas', async () => {
    fetchDaily.mockRejectedValue(new Error('x'));
    render(<DailyChallenge />);
    expect((await screen.findByRole('alert')).textContent).toBe(t.error);
  });

  it('joue le défi, envoie le score et montre le bonus', async () => {
    render(<DailyChallenge />);
    fireEvent.click(await screen.findByRole('button', { name: t.play }));
    fireEvent.click(screen.getByRole('button', { name: fr.games.trueFalse.true }));
    fireEvent.click(screen.getByRole('button', { name: fr.games.finish }));
    await waitFor(() => expect(sendDailyResult).toHaveBeenCalledWith('tok', 1));
    expect(await screen.findByText(t.bonus.replace('{n}', '20'))).toBeTruthy();
    expect(screen.getByText('+25 XP')).toBeTruthy();
  });

  it('revient à la carte, marquée terminée, après le défi', async () => {
    render(<DailyChallenge />);
    fireEvent.click(await screen.findByRole('button', { name: t.play }));
    fireEvent.click(screen.getByRole('button', { name: fr.games.trueFalse.false }));
    fireEvent.click(screen.getByRole('button', { name: fr.games.finish }));
    await waitFor(() => expect(sendMissed).toHaveBeenCalledWith('tok', [1]));
    fireEvent.click(await screen.findByRole('button', { name: t.close }));
    expect(await screen.findByText(t.done)).toBeTruthy();
  });

  it('garde le défi utilisable si l’envoi du score échoue', async () => {
    sendDailyResult.mockRejectedValue(new Error('x'));
    render(<DailyChallenge />);
    fireEvent.click(await screen.findByRole('button', { name: t.play }));
    fireEvent.click(screen.getByRole('button', { name: fr.games.trueFalse.true }));
    fireEvent.click(screen.getByRole('button', { name: fr.games.finish }));
    expect(await screen.findByRole('button', { name: t.close })).toBeTruthy();
    expect(screen.queryByText(/Bonus du jour/)).toBeNull();
  });
});
