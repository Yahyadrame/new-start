import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const ensureSession = vi.fn();
const listNotebook = vi.fn();
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./profile-api', () => ({ listNotebook }));
const { NotebookSection } = await import('./notebook-section');

const t = fr.profile.notebook;
const entry = (id: string, whyFr: string | null = null) => ({
  id,
  original: `before ${id}`,
  better: `after ${id}`,
  whyFr,
  createdAt: '2026-11-20T10:00:00.000Z',
});

beforeEach(() => {
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  listNotebook.mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('NotebookSection', () => {
  it('annonce le chargement puis le carnet vide', async () => {
    render(<NotebookSection />);
    expect(screen.getByText(t.loading)).toBeTruthy();
    expect(await screen.findByText(t.empty)).toBeTruthy();
    expect(listNotebook).toHaveBeenCalledWith('tok');
  });

  it('liste ce que la personne a écrit, la version plus naturelle et l’explication', async () => {
    listNotebook.mockResolvedValue([entry('1', 'Le passé de go est went.'), entry('2')]);
    render(<NotebookSection />);
    expect(await screen.findByText('after 1')).toBeTruthy();
    expect(screen.getByText('before 1')).toBeTruthy();
    expect(screen.getByText('Le passé de go est went.')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText(t.empty)).toBeNull();
  });

  it('propose de réessayer quand le chargement échoue', async () => {
    listNotebook.mockRejectedValueOnce(new Error('x')).mockResolvedValue([entry('1')]);
    render(<NotebookSection />);
    expect((await screen.findByRole('alert')).textContent).toBe(t.error);
    fireEvent.click(screen.getByRole('button', { name: t.retry }));
    expect(await screen.findByText('after 1')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('affiche l’erreur sans appeler l’API quand la session a disparu', async () => {
    ensureSession.mockResolvedValue(null);
    render(<NotebookSection />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(listNotebook).not.toHaveBeenCalled();
  });
});
