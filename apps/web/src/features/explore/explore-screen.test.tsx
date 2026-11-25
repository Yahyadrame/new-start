import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const push = vi.fn();
const ensureSession = vi.fn();
const listTopics = vi.fn();
const listAgents = vi.fn();
const startConversation = vi.fn();
const getTastes = vi.fn();
const router = { replace, push };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('../../shared/navigation', () => ({ BottomNav: () => <nav>barre du bas</nav> }));
vi.mock('./explore-api', () => ({
  listTopics,
  listAgents,
  startConversation,
  getTastes,
  ExploreError: class ExploreError extends Error {
    constructor(readonly status: number) {
      super(String(status));
    }
  },
}));
const { ExploreScreen } = await import('./explore-screen');
const { ExploreError } = await import('./explore-api');

const t = fr.explore;
const topics = [
  { slug: 'voyage', nameFr: 'Voyage', agentCount: 3 },
  { slug: 'travail', nameFr: 'Travail', agentCount: 1 },
  { slug: 'sante', nameFr: 'Santé', agentCount: 0 },
];
const card = (slug: string, name: string) => ({
  slug,
  name,
  initials: name.slice(0, 1),
  roleFr: `Rôle de ${name}`,
  category: 'Voyage',
  topic: 'voyage',
});

beforeEach(() => {
  vi.clearAllMocks();
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  listTopics.mockResolvedValue(topics);
  listAgents.mockResolvedValue([card('sam', 'Sam'), card('lea', 'Léa')]);
  startConversation.mockResolvedValue({ id: 'c1' });
  getTastes.mockResolvedValue({ goal: 'FRIENDS', interests: [] });
});
afterEach(cleanup);

describe('ExploreScreen', () => {
  it('renvoie vers l’accueil sans session', async () => {
    ensureSession.mockResolvedValue(null);
    render(<ExploreScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(listTopics).not.toHaveBeenCalled();
  });

  it('affiche les thèmes, avec « Bientôt » et sans ouverture pour un thème vide', async () => {
    render(<ExploreScreen />);
    expect(await screen.findByText('3 contacts')).toBeTruthy();
    expect(screen.getByText(t.contactOne)).toBeTruthy();
    const soon = screen.getByRole('button', { name: /Santé/ }) as HTMLButtonElement;
    expect(soon.disabled).toBe(true);
    expect(screen.getByText(t.soon)).toBeTruthy();
    expect(screen.getByText('barre du bas')).toBeTruthy();
  });

  it('montre les contacts d’un thème, et le retour aux thèmes', async () => {
    render(<ExploreScreen />);
    fireEvent.click(await screen.findByRole('button', { name: /Voyage/ }));
    expect(await screen.findByText('Sam')).toBeTruthy();
    expect(listAgents).toHaveBeenCalledWith('tok', { topic: 'voyage', q: '' });
    fireEvent.click(screen.getByRole('button', { name: t.back }));
    expect(await screen.findByRole('list', { name: t.topicsLabel })).toBeTruthy();
  });

  it('cherche un contact après une courte pause de frappe', async () => {
    render(<ExploreScreen />);
    await screen.findByText('3 contacts');
    fireEvent.change(screen.getByRole('searchbox', { name: t.searchLabel }), {
      target: { value: ' sam ' },
    });
    expect(await screen.findByText('Sam')).toBeTruthy();
    expect(listAgents).toHaveBeenCalledWith('tok', { topic: undefined, q: 'sam' });
  });

  it('dit quand rien ne correspond, ou quand le thème est vide', async () => {
    listAgents.mockResolvedValue([]);
    render(<ExploreScreen />);
    fireEvent.change(await screen.findByRole('searchbox'), { target: { value: 'zzz' } });
    expect(await screen.findByText(t.noResult)).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    fireEvent.click(await screen.findByRole('button', { name: /Voyage/ }));
    expect(await screen.findByText(t.emptyTopic)).toBeTruthy();
  });

  it('ouvre la discussion quand on écrit à un contact', async () => {
    render(<ExploreScreen />);
    fireEvent.click(await screen.findByRole('button', { name: /Voyage/ }));
    fireEvent.click(
      await screen.findByRole('button', { name: t.writeTo.replace('{name}', 'Sam') }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/chats/sam'));
    expect(startConversation).toHaveBeenCalledWith('tok', 'sam');
  });

  it('explique le refus pour un contact réservé aux majeurs, ou un autre échec', async () => {
    render(<ExploreScreen />);
    fireEvent.click(await screen.findByRole('button', { name: /Voyage/ }));
    const button = await screen.findByRole('button', { name: t.writeTo.replace('{name}', 'Sam') });
    startConversation.mockRejectedValueOnce(new ExploreError(403));
    fireEvent.click(button);
    expect((await screen.findByRole('alert')).textContent).toBe(t.adultOnly);
    startConversation.mockRejectedValueOnce(new Error('réseau'));
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(t.writeError));
    expect(push).not.toHaveBeenCalled();
  });

  it('affiche une erreur quand les thèmes ne se chargent pas', async () => {
    listTopics.mockRejectedValue(new Error('x'));
    render(<ExploreScreen />);
    expect((await screen.findByRole('alert')).textContent).toBe(t.error);
  });

  it('affiche une erreur quand la recherche échoue', async () => {
    listAgents.mockRejectedValue(new Error('x'));
    render(<ExploreScreen />);
    fireEvent.click(await screen.findByRole('button', { name: /Voyage/ }));
    expect((await screen.findByRole('alert')).textContent).toBe(t.error);
  });

  it('met en avant les thèmes de son objectif et de ses centres d’intérêt, sans « Bientôt »', async () => {
    listTopics.mockResolvedValue([
      { slug: 'travel', nameFr: 'Voyage', agentCount: 2 },
      { slug: 'gaming', nameFr: 'Jeux vidéo', agentCount: 1 },
      { slug: 'health', nameFr: 'Santé', agentCount: 0 },
    ]);
    getTastes.mockResolvedValue({ goal: 'TRAVEL', interests: ['GAMING', 'HEALTH'] });
    render(<ExploreScreen />);
    const section = (await screen.findByRole('heading', { name: t.forYou })).closest('section');
    const names = Array.from(section?.querySelectorAll('button') ?? []).map((b) => b.textContent);
    expect(names).toEqual(['Voyage', 'Jeux vidéo']);
    fireEvent.click(screen.getAllByRole('button', { name: 'Jeux vidéo' })[0] as HTMLElement);
    await waitFor(() => expect(listAgents).toHaveBeenCalledWith('tok', { topic: 'gaming', q: '' }));
  });

  it('n’affiche pas « Pour toi » sans préférence, ni quand le profil ne charge pas', async () => {
    render(<ExploreScreen />);
    await screen.findByText('Voyage');
    expect(screen.queryByRole('heading', { name: t.forYou })).toBeNull();
    cleanup();
    getTastes.mockRejectedValue(new Error('réseau'));
    render(<ExploreScreen />);
    await screen.findByText('Voyage');
    expect(screen.queryByRole('heading', { name: t.forYou })).toBeNull();
  });
});
