import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const searchMessages = vi.fn();
vi.mock('./chats-api', () => ({ searchMessages }));
const { SearchResults } = await import('./search-results');

const t = fr.chats;
const hit = (id: string, author: 'USER' | 'AGENT', excerpt: string) => ({
  messageId: id,
  conversationId: 'c1',
  author,
  excerpt,
  createdAt: '2026-11-20T10:00:00.000Z',
  agent: { slug: 'jade', name: 'Jade', initials: 'J' },
});

const flush = () => act(() => vi.advanceTimersByTimeAsync(350));

beforeEach(() => {
  vi.useFakeTimers();
  searchMessages.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SearchResults', () => {
  it('ne cherche pas et ne montre rien sous 2 caractères', async () => {
    const { container } = render(<SearchResults token="tok" query=" a " />);
    await flush();
    expect(container.firstChild).toBeNull();
    expect(searchMessages).not.toHaveBeenCalled();
  });

  it('attend la fin de la frappe puis cherche une seule fois', async () => {
    searchMessages.mockResolvedValue([]);
    const { rerender } = render(<SearchResults token="tok" query="he" />);
    await act(() => vi.advanceTimersByTimeAsync(100));
    rerender(<SearchResults token="tok" query="hel" />);
    await flush();
    expect(searchMessages).toHaveBeenCalledTimes(1);
    expect(searchMessages).toHaveBeenCalledWith('tok', 'hel');
  });

  it('montre le contact, la date, le mot surligné et un lien vers le bon message', async () => {
    searchMessages.mockResolvedValue([
      hit('m1', 'AGENT', 'Well, Hello there'),
      hit('m2', 'USER', 'hello!'),
    ]);
    render(<SearchResults token="tok" query="hello" />);
    expect(screen.getByLabelText(t.searchLoading)).toBeTruthy();
    await flush();
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/chats/jade?message=m1',
      '/chats/jade?message=m2',
    ]);
    expect(links[0]?.textContent).toContain('Jade');
    expect(links[0]?.querySelector('time')).not.toBeNull();
    expect(links[0]?.querySelector('mark')?.textContent).toBe('Hello');
    expect(links[1]?.textContent).toContain(t.you);
  });

  it('dit quand aucun message ne correspond', async () => {
    searchMessages.mockResolvedValue([]);
    render(<SearchResults token="tok" query="zzz" />);
    await flush();
    expect(screen.getByText(t.searchNone.replace('{q}', 'zzz'))).toBeTruthy();
  });

  it('annonce l’échec de la recherche', async () => {
    searchMessages.mockRejectedValue(new Error('x'));
    render(<SearchResults token="tok" query="zzz" />);
    await flush();
    expect(screen.getByRole('alert').textContent).toBe(t.searchError);
  });

  it('ignore la réponse d’une recherche déjà remplacée', async () => {
    let resolveFirst: (v: unknown[]) => void = () => undefined;
    searchMessages
      .mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)))
      .mockResolvedValueOnce([hit('m2', 'AGENT', 'second answer')]);
    const { rerender } = render(<SearchResults token="tok" query="first" />);
    await flush();
    rerender(<SearchResults token="tok" query="second" />);
    await flush();
    await act(async () => resolveFirst([hit('m1', 'AGENT', 'first answer')]));
    expect(screen.queryByText(/first answer/)).toBeNull();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/chats/jade?message=m2');
  });
});
