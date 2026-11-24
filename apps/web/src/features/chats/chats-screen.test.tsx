import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const ensureSession = vi.fn();
const listConversations = vi.fn();
// Un objet stable, comme le routeur de Next : sinon l'effet de chargement repart à chaque rendu.
const router = { replace };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./chats-api', () => ({ listConversations }));
vi.mock('../../shared/navigation', () => ({ BottomNav: () => <nav>barre du bas</nav> }));
const { ChatsScreen } = await import('./chats-screen');

const t = fr.chats;
const agent = (slug: string, name: string, category: string) => ({
  slug,
  name,
  initials: name.slice(0, 1),
  roleFr: `Rôle de ${name}`,
  category,
});
const when = new Date().toISOString();
const items = [
  {
    id: 'c1',
    agent: agent('jade', 'Jade', 'Quotidien'),
    lastMessage: { author: 'AGENT', text: 'Heyyy!' },
    lastMessageAt: when,
    unreadCount: 2,
  },
  {
    id: 'c2',
    agent: agent('emma', 'Emma Lin', 'Pro'),
    lastMessage: { author: 'USER', text: 'See you' },
    lastMessageAt: when,
    unreadCount: 0,
  },
  {
    id: 'c3',
    agent: agent('sam', 'Sam', 'Quotidien'),
    lastMessage: null,
    lastMessageAt: when,
    unreadCount: 0,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  listConversations.mockResolvedValue(items);
});
afterEach(cleanup);

describe('ChatsScreen', () => {
  it('affiche la barre d’onglets du bas', async () => {
    render(<ChatsScreen />);
    expect(await screen.findByText('barre du bas')).toBeTruthy();
  });

  it('renvoie vers l’accueil sans session', async () => {
    ensureSession.mockResolvedValue(null);
    render(<ChatsScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(listConversations).not.toHaveBeenCalled();
  });

  it('liste les contacts avec badge IA, aperçu, non lus et lien vers la conversation', async () => {
    render(<ChatsScreen />);
    const jade = (await screen.findByText('Heyyy!')).closest('a');
    expect(jade?.getAttribute('href')).toBe('/chats/jade');
    expect(jade?.textContent).toContain(t.aiBadge);
    expect(screen.getByLabelText(t.unread.replace('{n}', '2'))).toBeTruthy();
    expect(screen.getByText(`${t.you}See you`)).toBeTruthy();
    expect(screen.getByText(t.noMessage)).toBeTruthy();
    expect(listConversations).toHaveBeenCalledWith('tok');
  });

  it('cherche par prénom ou par message, sans tenir compte des accents', async () => {
    render(<ChatsScreen />);
    await screen.findByText('Heyyy!');
    const search = screen.getByRole('searchbox', { name: t.searchLabel });
    fireEvent.change(search, { target: { value: 'EMMA' } });
    expect(screen.getByText(`${t.you}See you`)).toBeTruthy();
    expect(screen.queryByText('Heyyy!')).toBeNull();
    fireEvent.change(search, { target: { value: 'heyyy' } });
    expect(screen.getByText('Heyyy!')).toBeTruthy();
    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.getByText(t.noMatch)).toBeTruthy();
  });

  it('propose le bouton « + » vers Explorer', async () => {
    render(<ChatsScreen />);
    const link = await screen.findByRole('link', { name: t.explore });
    expect(link.getAttribute('href')).toBe('/explore');
  });

  it('filtre par non lus puis par catégorie', async () => {
    render(<ChatsScreen />);
    await screen.findByText('Heyyy!');
    fireEvent.click(screen.getByRole('button', { name: t.filters.unread }));
    expect(screen.getByText('Heyyy!')).toBeTruthy();
    expect(screen.queryByText(`${t.you}See you`)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pro' }));
    expect(screen.getByText(`${t.you}See you`)).toBeTruthy();
    expect(screen.queryByText('Heyyy!')).toBeNull();
    expect(screen.getByRole('button', { name: 'Pro' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Voyage' }));
    expect(screen.getByText(t.emptyFilter)).toBeTruthy();
  });

  it('invite à choisir un contact quand il n’y a aucune conversation', async () => {
    listConversations.mockResolvedValue([]);
    render(<ChatsScreen />);
    expect(await screen.findByText(t.empty)).toBeTruthy();
    expect(screen.queryByRole('group', { name: t.filtersLabel })).toBeNull();
  });

  it('annonce l’erreur de chargement', async () => {
    listConversations.mockRejectedValue(new Error('x'));
    render(<ChatsScreen />);
    expect((await screen.findByRole('alert')).textContent).toBe(t.error);
  });
});
