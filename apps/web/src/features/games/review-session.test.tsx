import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const ensureSession = vi.fn();
const fetchDueReviews = vi.fn();
const gradeReview = vi.fn();
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./games-api', () => ({ fetchDueReviews, gradeReview }));
const { ReviewSession } = await import('./review-session');

const t = fr.games.review;
const card = (id: string, text: string, meaningFr: string) => ({
  id,
  expressionId: 1,
  text,
  meaningFr,
  due: '2026-11-21T00:00:00Z',
});

beforeEach(() => {
  vi.clearAllMocks();
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  gradeReview.mockResolvedValue(undefined);
  fetchDueReviews.mockResolvedValue([card('c1', 'You know', 'tu sais')]);
});
afterEach(cleanup);

describe('ReviewSession', () => {
  it('annonce une carte à revoir', async () => {
    render(<ReviewSession />);
    expect(await screen.findByText(t.one)).toBeTruthy();
    expect(screen.getByRole('button', { name: t.start })).toBeTruthy();
  });

  it('annonce le nombre de cartes à revoir', async () => {
    fetchDueReviews.mockResolvedValue([card('c1', 'A', 'a'), card('c2', 'B', 'b')]);
    render(<ReviewSession />);
    expect(await screen.findByText(t.count.replace('{n}', '2'))).toBeTruthy();
  });

  it('dit qu’il n’y a rien à revoir, sans bouton', async () => {
    fetchDueReviews.mockResolvedValue([]);
    render(<ReviewSession />);
    expect(await screen.findByText(t.none)).toBeTruthy();
    expect(screen.queryByRole('button', { name: t.start })).toBeNull();
  });

  it('affiche une erreur si les cartes ne chargent pas', async () => {
    fetchDueReviews.mockRejectedValue(new Error('x'));
    render(<ReviewSession />);
    expect((await screen.findByRole('alert')).textContent).toBe(t.error);
  });

  it('cache le sens jusqu’au clic, puis note la carte', async () => {
    fetchDueReviews.mockResolvedValue([
      card('c1', 'You know', 'tu sais'),
      card('c2', 'Wanna', 'veux'),
    ]);
    render(<ReviewSession />);
    fireEvent.click(await screen.findByRole('button', { name: t.start }));
    expect(screen.getByText('You know')).toBeTruthy();
    expect(screen.queryByText('tu sais')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: t.show }));
    expect(screen.getByText('tu sais')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t.good }));
    await waitFor(() => expect(gradeReview).toHaveBeenCalledWith('tok', 'c1', 'good'));
    expect(await screen.findByText('Wanna')).toBeTruthy();
    expect(screen.queryByText('veux')).toBeNull();
  });

  it('finit la séance et revient à « rien à revoir »', async () => {
    render(<ReviewSession />);
    fireEvent.click(await screen.findByRole('button', { name: t.start }));
    fireEvent.click(screen.getByRole('button', { name: t.show }));
    fireEvent.click(screen.getByRole('button', { name: t.again }));
    expect(await screen.findByText(t.doneTitle)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t.close }));
    expect(await screen.findByText(t.none)).toBeTruthy();
  });

  it('garde la carte et prévient si la note n’est pas enregistrée', async () => {
    gradeReview.mockRejectedValue(new Error('x'));
    render(<ReviewSession />);
    fireEvent.click(await screen.findByRole('button', { name: t.start }));
    fireEvent.click(screen.getByRole('button', { name: t.show }));
    fireEvent.click(screen.getByRole('button', { name: t.easy }));
    expect((await screen.findByRole('alert')).textContent).toBe(t.gradeError);
    expect(screen.getByText('You know')).toBeTruthy();
  });
});
