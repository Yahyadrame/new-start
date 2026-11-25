import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const push = vi.fn();
const ensureSession = vi.fn();
const listConversations = vi.fn();
const loadContactAvatars = vi.fn();
const chooseContactAvatar = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push }) }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./chats-api', () => ({ listConversations }));
vi.mock('../../shared/avatar/contact-avatars', () => ({
  loadContactAvatars,
  chooseContactAvatar,
  useContactChoice: () => null,
}));
const { ContactAvatarScreen } = await import('./contact-avatar-screen');

const t = fr.avatar;
const jade = { id: 'c1', agent: { slug: 'jade', name: 'Jade' } };

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
  loadContactAvatars.mockResolvedValue(undefined);
  chooseContactAvatar.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('ContactAvatarScreen', () => {
  it('renvoie à l’accueil sans session', async () => {
    ensureSession.mockResolvedValue(null);
    render(<ContactAvatarScreen agentSlug="jade" />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  it('affiche le titre et le lien de retour vers la conversation', async () => {
    render(<ContactAvatarScreen agentSlug="jade" />);
    expect(await screen.findByRole('heading', { name: 'Avatar de Jade' })).toBeTruthy();
    expect(screen.getByRole('link', { name: fr.conversation.back }).getAttribute('href')).toBe(
      '/chats/jade',
    );
  });

  it('enregistre le choix puis revient à la conversation', async () => {
    render(<ContactAvatarScreen agentSlug="jade" />);
    fireEvent.click(
      await screen.findByRole('button', { name: t.silhouetteN.replace('{id}', '009') }),
    );
    fireEvent.click(screen.getByRole('button', { name: t.save }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/chats/jade'));
    expect(chooseContactAvatar).toHaveBeenCalledWith('tok', 'jade', { id: 'a009', variant: 'duo' });
  });

  it('revient à l’original', async () => {
    render(<ContactAvatarScreen agentSlug="jade" />);
    fireEvent.click(await screen.findByRole('button', { name: t.resetContact }));
    await waitFor(() => expect(chooseContactAvatar).toHaveBeenCalledWith('tok', 'jade', null));
  });

  it('signale un contact inconnu ou une erreur réseau', async () => {
    listConversations.mockResolvedValue([]);
    render(<ContactAvatarScreen agentSlug="jade" />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('button', { name: t.save })).toBeNull();
  });
});
