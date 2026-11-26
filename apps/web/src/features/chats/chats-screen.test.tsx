import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const ensureSession = vi.fn();
const listConversations = vi.fn();
const searchMessages = vi.fn();
// Un objet stable, comme le routeur de Next : sinon l'effet de chargement repart à chaque rendu.
const router = { replace };
const usePathname = vi.fn(() => '/chats');
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./chats-api', () => ({ listConversations, searchMessages }));
vi.mock('../../shared/navigation', () => ({
  BottomNav: () => <nav>barre du bas</nav>,
  NotificationsBell: () => <span>cloche</span>,
}));
const { ChatsScreen } = await import('./chats-screen');
const { CHATS_CHANGED, LIST_POLL_MS } = await import('./chats-merge');

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
  it('met la cloche des notifications dans l’en-tête, à côté du titre', async () => {
    render(<ChatsScreen />);
    await screen.findByText('barre du bas');
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.parentElement?.tagName).toBe('HEADER');
    expect(heading.parentElement?.textContent).toContain('cloche');
  });

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
    fireEvent.click(screen.getByRole('button', { name: t.filters.moreLabel }));
    fireEvent.click(screen.getByRole('button', { name: 'Pro' }));
    expect(screen.getByText(`${t.you}See you`)).toBeTruthy();
    expect(screen.queryByText('Heyyy!')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Voyage' }));
    expect(screen.getByText(t.emptyFilter)).toBeTruthy();
  });

  it('ne montre que trois filtres, le reste est dans le menu « Plus »', async () => {
    render(<ChatsScreen />);
    await screen.findByText('Heyyy!');
    const row = screen.getByRole('group', { name: t.filtersLabel });
    const names = within(row)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names).toEqual([t.filters.all, t.filters.unread, 'Quotidien', t.filters.more]);
    expect(screen.queryByRole('button', { name: 'Business' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: t.filters.moreLabel }));
    for (const name of ['Pro', 'Business', 'Voyage']) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
  });

  it('garde visible dans la rangée la catégorie choisie dans le menu', async () => {
    render(<ChatsScreen />);
    await screen.findByText('Heyyy!');
    fireEvent.click(screen.getByRole('button', { name: t.filters.moreLabel }));
    fireEvent.click(screen.getByRole('button', { name: 'Pro' }));
    expect(screen.queryByRole('button', { name: 'Voyage' })).toBeNull();
    const row = screen.getByRole('group', { name: t.filtersLabel });
    const chosen = within(row).getByRole('button', { name: 'Pro' });
    expect(chosen.className).toContain('bg-accent');
    expect(within(row).queryByRole('button', { name: t.filters.more })).toBeNull();
  });

  it('aligne l’en-tête sur 64 px à côté de la conversation sur ordinateur', async () => {
    render(<ChatsScreen />);
    await screen.findByText('Heyyy!');
    expect(screen.getByRole('banner').className).toContain('lg:h-16');
    expect(screen.getByRole('main').className).toContain('lg:pt-0');
  });

  it('masque la barre de défilement de la rangée de filtres', async () => {
    render(<ChatsScreen />);
    await screen.findByText('Heyyy!');
    expect(screen.getByRole('group', { name: t.filtersLabel }).className).toContain(
      '[scrollbar-width:none]',
    );
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

describe('ChatsScreen : mise à jour de la liste', () => {
  const replied = [
    { ...items[1], lastMessage: { author: 'AGENT', text: 'Got it!' }, unreadCount: 1 },
  ];
  const badge = () => screen.queryByLabelText(t.unread.replace('{n}', '1'));
  const tick = () => act(() => vi.advanceTimersByTimeAsync(LIST_POLL_MS));
  const appVisibility = (state: 'visible' | 'hidden') => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
    return act(async () => void document.dispatchEvent(new Event('visibilitychange')));
  };
  const open = async () => {
    const view = render(<ChatsScreen />);
    await screen.findByText('Heyyy!');
    listConversations.mockClear();
    listConversations.mockResolvedValue(replied);
    return view;
  };

  beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }));
  afterEach(() => {
    vi.useRealTimers();
    usePathname.mockReturnValue('/chats');
    Reflect.deleteProperty(document, 'visibilityState');
  });

  it('montre le badge d’une réponse arrivée après l’ouverture de la liste', async () => {
    await open();
    await tick();
    expect(screen.getByText('Got it!')).toBeTruthy();
    expect(badge()).toBeTruthy();
  });

  it('relit dès qu’on change d’écran', async () => {
    const view = await open();
    usePathname.mockReturnValue('/chats/jade');
    view.rerender(<ChatsScreen />);
    expect(await screen.findByText('Got it!')).toBeTruthy();
  });

  it('relit dès qu’une conversation est marquée lue', async () => {
    await open();
    await act(async () => void window.dispatchEvent(new Event(CHATS_CHANGED)));
    expect(screen.getByText('Got it!')).toBeTruthy();
  });

  it('ne relit pas en arrière-plan, puis relit au retour', async () => {
    await open();
    await appVisibility('hidden');
    await tick();
    expect(listConversations).not.toHaveBeenCalled();
    await appVisibility('visible');
    expect(screen.getByText('Got it!')).toBeTruthy();
  });

  it('garde la liste quand une relecture échoue ou que la session ne répond pas', async () => {
    await open();
    listConversations.mockRejectedValue(new Error('réseau'));
    await tick();
    ensureSession.mockResolvedValue(null);
    await tick();
    expect(screen.getByText('Heyyy!')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it('retire l’erreur dès qu’une relecture réussit', async () => {
    listConversations.mockRejectedValueOnce(new Error('réseau'));
    render(<ChatsScreen />);
    await screen.findByRole('alert');
    await tick();
    expect(screen.getByText('Heyyy!')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('ignore une ancienne réponse arrivée après une plus récente', async () => {
    await open();
    let late: (list: unknown) => void = () => undefined;
    listConversations.mockReturnValueOnce(new Promise((resolve) => (late = resolve)));
    await tick();
    await tick();
    await act(async () => late(items));
    expect(screen.getByText('Got it!')).toBeTruthy();
  });

  it('affiche quand même la liste quand chaque réponse dépasse le rythme de relecture', async () => {
    const answers: ((list: unknown) => void)[] = [];
    listConversations.mockImplementation(() => new Promise((resolve) => answers.push(resolve)));
    render(<ChatsScreen />);
    await act(async () => undefined);
    await tick();
    await act(async () => answers[0]?.(items));
    expect(screen.getByText('Heyyy!')).toBeTruthy();
  });

  it('ne renvoie pas à l’accueil quand la session ne répond pas après un changement d’écran', async () => {
    const view = await open();
    ensureSession.mockResolvedValue(null);
    usePathname.mockReturnValue('/chats/jade');
    await act(async () => view.rerender(<ChatsScreen />));
    expect(replace).not.toHaveBeenCalled();
  });

  it('s’arrête quand la liste disparaît', async () => {
    const view = await open();
    view.unmount();
    await tick();
    expect(listConversations).not.toHaveBeenCalled();
  });
});

describe('ChatsScreen : recherche dans les messages', () => {
  beforeEach(() => {
    ensureSession.mockResolvedValue({ accessToken: 'tok' });
    listConversations.mockResolvedValue(items);
    searchMessages.mockResolvedValue([
      {
        messageId: 'm1',
        conversationId: 'c1',
        author: 'AGENT',
        excerpt: 'Heyyy, see you soon',
        createdAt: when,
        agent: agent('jade', 'Jade', 'Quotidien'),
      },
    ]);
  });

  it('cherche dans les messages avec le jeton et lie chaque résultat à son message', async () => {
    render(<ChatsScreen />);
    fireEvent.change(await screen.findByRole('searchbox', { name: t.searchLabel }), {
      target: { value: 'see' },
    });
    await waitFor(() => expect(searchMessages).toHaveBeenCalledWith('tok', 'see'));
    const section = await screen.findByRole('region', { name: t.searchMessages });
    expect(within(section).getByRole('link').getAttribute('href')).toBe('/chats/jade?message=m1');
  });

  it('ne cherche pas dans les messages tant que le champ est vide', async () => {
    render(<ChatsScreen />);
    await screen.findByRole('searchbox', { name: t.searchLabel });
    expect(screen.queryByRole('region', { name: t.searchMessages })).toBeNull();
    expect(searchMessages).not.toHaveBeenCalled();
  });
});
