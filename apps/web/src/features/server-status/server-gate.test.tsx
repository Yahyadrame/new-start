import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ServerGate } from './server-gate';

const respond = (ok: boolean) => vi.fn().mockResolvedValue({ ok });
const tick = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('ServerGate', () => {
  it("laisse passer sans interroger quand aucune URL d'API n'est configurée", () => {
    const fetchMock = respond(true);
    vi.stubGlobal('fetch', fetchMock);
    render(<ServerGate>contenu</ServerGate>);
    expect(screen.getByText('contenu')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('affiche le contenu sans écran intermédiaire quand le serveur répond vite', async () => {
    const fetchMock = respond(true);
    vi.stubGlobal('fetch', fetchMock);
    render(<ServerGate apiUrl="https://api.test">contenu</ServerGate>);
    expect(screen.queryByText('contenu')).toBeNull();
    await tick(0);
    expect(screen.getByText('contenu')).toBeTruthy();
    expect(screen.queryByText('Connexion au serveur…')).toBeNull();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.test/health/live');
  });

  it("montre « Connexion au serveur… » après 500 ms, puis le contenu quand l'API répond", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockRejectedValueOnce(new Error('réseau'))
      .mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    render(<ServerGate apiUrl="https://api.test">contenu</ServerGate>);
    await tick(600);
    expect(screen.getByRole('status').textContent).toContain('Connexion au serveur…');
    await tick(3000);
    expect(screen.queryByText('contenu')).toBeNull();
    await tick(3000);
    expect(screen.getByText('contenu')).toBeTruthy();
  });

  it('abandonne après deux minutes, puis relance sur « Réessayer »', async () => {
    const fetchMock = respond(false);
    vi.stubGlobal('fetch', fetchMock);
    render(<ServerGate apiUrl="https://api.test">contenu</ServerGate>);
    await tick(125_000);
    expect(screen.getByText('Le serveur ne répond pas')).toBeTruthy();
    fetchMock.mockResolvedValue({ ok: true });
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    await tick(0);
    expect(screen.getByText('contenu')).toBeTruthy();
  });

  it("n'interroge plus l'API une fois démonté", async () => {
    const fetchMock = respond(false);
    vi.stubGlobal('fetch', fetchMock);
    const { unmount } = render(<ServerGate apiUrl="https://api.test">contenu</ServerGate>);
    await tick(0);
    const calls = fetchMock.mock.calls.length;
    unmount();
    await tick(10_000);
    expect(fetchMock.mock.calls.length).toBe(calls);
  });
});
