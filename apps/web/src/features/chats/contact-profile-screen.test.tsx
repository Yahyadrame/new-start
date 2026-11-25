import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const ensureSession = vi.fn();
const listConversations = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./chats-api', () => ({ listConversations }));
vi.mock('../../shared/avatar/contact-avatars', () => ({
  loadContactAvatars: vi.fn().mockResolvedValue(undefined),
  useContactChoice: () => null,
}));
const { ContactProfileScreen } = await import('./contact-profile-screen');

const jade = {
  id: 'c1',
  agent: {
    slug: 'jade',
    name: 'Jade',
    initials: 'J',
    roleFr: 'Coloc · familier',
    category: 'Quotidien',
    accent: 'en-US',
  },
};

beforeAll(() => {
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});
beforeEach(() => {
  vi.clearAllMocks();
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  listConversations.mockResolvedValue([jade]);
});
afterEach(cleanup);

describe('ContactProfileScreen', () => {
  it('renvoie à l’accueil sans session', async () => {
    ensureSession.mockResolvedValue(null);
    render(<ContactProfileScreen agentSlug="jade" />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  it('montre le nom, le rôle, l’accent et le thème', async () => {
    render(<ContactProfileScreen agentSlug="jade" />);
    expect(await screen.findByRole('heading', { name: /Jade/ })).toBeTruthy();
    expect(screen.getByText('Coloc · familier')).toBeTruthy();
    expect(screen.getByText('Américain')).toBeTruthy();
    expect(screen.getByText('Quotidien')).toBeTruthy();
    expect(screen.getByText(fr.contact.aiNote.replace('{name}', 'Jade'))).toBeTruthy();
  });

  it('garde le code d’un accent sans libellé', async () => {
    listConversations.mockResolvedValue([{ ...jade, agent: { ...jade.agent, accent: 'en-AU' } }]);
    render(<ContactProfileScreen agentSlug="jade" />);
    expect(await screen.findByText('en-AU')).toBeTruthy();
  });

  it('mène à la conversation et au choix d’avatar', async () => {
    render(<ContactProfileScreen agentSlug="jade" />);
    expect((await screen.findByRole('link', { name: fr.contact.write })).getAttribute('href')).toBe(
      '/chats/jade',
    );
    expect(screen.getByRole('link', { name: fr.contact.changeAvatar }).getAttribute('href')).toBe(
      '/chats/jade/avatar',
    );
    expect(screen.getByRole('link', { name: fr.conversation.back }).getAttribute('href')).toBe(
      '/chats/jade',
    );
  });

  it('signale un contact inconnu', async () => {
    listConversations.mockResolvedValue([]);
    render(<ContactProfileScreen agentSlug="jade" />);
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('signale une erreur réseau', async () => {
    listConversations.mockRejectedValue(new Error('réseau'));
    render(<ContactProfileScreen agentSlug="jade" />);
    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
