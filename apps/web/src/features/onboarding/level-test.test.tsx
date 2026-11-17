import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LEVEL_QUESTIONS } from '@newstart/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSession, setSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const api = vi.hoisted(() => ({ sendLevelAnswer: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => nav }));
vi.mock('./send-level-answer', async (orig) => ({
  ...(await orig<typeof import('./send-level-answer')>()),
  sendLevelAnswer: api.sendLevelAnswer,
}));
const { LevelTest } = await import('./level-test');
const { LevelAnswerError } = await import('./send-level-answer');
const t = fr.level;

const session = {
  accessToken: 'tok',
  expiresInSeconds: 900,
  user: { id: 'u1', firstName: 'Awa', goal: 'WORK', level: 'A1' },
};
const result = {
  done: true as const,
  level: 'B1' as const,
  justification: 'Tu te fais comprendre.',
  strengths: ['a', 'b', 'c'],
  weaknesses: ['d', 'e', 'f'],
};

beforeEach(() => {
  vi.clearAllMocks();
  setSession(session);
});
afterEach(cleanup);

const field = () => screen.getByLabelText(t.answerLabel) as HTMLTextAreaElement;
const write = (value: string) => fireEvent.change(field(), { target: { value } });
const send = () => fireEvent.click(screen.getByRole('button', { name: t.send }));
const progress = (n: number) => `Question ${n} sur 5`;

describe('LevelTest', () => {
  it("renvoie vers l'inscription sans session", () => {
    setSession(null);
    const { container } = render(<LevelTest />);
    expect(container.textContent).toBe('');
    expect(nav.replace).toHaveBeenCalledWith('/signup');
  });

  it('pose la première question et bloque l’envoi tant que la réponse est vide', () => {
    render(<LevelTest />);
    expect(screen.getByText(LEVEL_QUESTIONS[0].text, { exact: false })).toBeTruthy();
    expect(screen.getByText(progress(1))).toBeTruthy();
    expect((screen.getByRole('button', { name: t.send }) as HTMLButtonElement).disabled).toBe(true);
    write('   ');
    expect((screen.getByRole('button', { name: t.send }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('envoie la réponse, l’affiche puis pose la question suivante', async () => {
    api.sendLevelAnswer.mockResolvedValue({ done: false, next: 2 });
    render(<LevelTest />);
    write('  I am Awa  ');
    send();
    await waitFor(() => expect(screen.getByText(progress(2))).toBeTruthy());
    expect(api.sendLevelAnswer).toHaveBeenCalledWith('tok', { position: 1, text: 'I am Awa' });
    expect(screen.getByText('I am Awa', { exact: false })).toBeTruthy();
    expect(screen.getByText(LEVEL_QUESTIONS[1].text, { exact: false })).toBeTruthy();
    expect(field().value).toBe('');
  });

  it('envoie avec Entrée mais pas avec Maj+Entrée', async () => {
    api.sendLevelAnswer.mockResolvedValue({ done: false, next: 2 });
    render(<LevelTest />);
    write('Hello');
    fireEvent.keyDown(field(), { key: 'Enter', shiftKey: true });
    fireEvent.keyDown(field(), { key: 'a' });
    expect(api.sendLevelAnswer).not.toHaveBeenCalled();
    fireEvent.keyDown(field(), { key: 'Enter' });
    await waitFor(() => expect(api.sendLevelAnswer).toHaveBeenCalledOnce());
  });

  it('après la dernière réponse, montre le résultat, garde le niveau en session et ouvre l’appli', async () => {
    api.sendLevelAnswer
      .mockResolvedValueOnce({ done: false, next: 5 })
      .mockResolvedValueOnce(result);
    render(<LevelTest />);
    write('one');
    send();
    await waitFor(() => expect(screen.getByText(progress(5))).toBeTruthy());
    write('last');
    send();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('B1'));
    expect(getSession()?.user.level).toBe('B1');
    fireEvent.click(screen.getByRole('button', { name: t.result.start }));
    expect(nav.push).toHaveBeenCalledWith('/');
  });

  it('annonce que Jade lit les réponses pendant l’évaluation finale', async () => {
    let finish: (v: unknown) => void = () => {};
    api.sendLevelAnswer
      .mockResolvedValueOnce({ done: false, next: 5 })
      .mockReturnValueOnce(new Promise((r) => (finish = r)));
    render(<LevelTest />);
    write('one');
    send();
    await waitFor(() => expect(screen.getByText(progress(5))).toBeTruthy());
    write('last');
    send();
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(t.evaluating));
    await act(async () => finish(result));
  });

  it.each([
    [503, t.errors.unavailable],
    [409, t.errors.incomplete],
    [500, t.errors.server],
  ])('statut %i : message lisible, réponse conservée pour réessayer', async (status, message) => {
    api.sendLevelAnswer.mockRejectedValue(new LevelAnswerError(status));
    render(<LevelTest />);
    write('Hello');
    send();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(message));
    expect(field().value).toBe('Hello');
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('traite une erreur réseau comme une erreur serveur', async () => {
    api.sendLevelAnswer.mockRejectedValue(new TypeError('fetch failed'));
    render(<LevelTest />);
    write('Hello');
    send();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(t.errors.server));
  });

  it("renvoie vers l'inscription quand le jeton est refusé", async () => {
    api.sendLevelAnswer.mockRejectedValue(new LevelAnswerError(401));
    render(<LevelTest />);
    write('Hello');
    send();
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/signup'));
  });
});
