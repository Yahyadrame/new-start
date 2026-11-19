import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const ensureSession = vi.fn();
const listConversations = vi.fn();
const router = { replace };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./chats-api', () => ({ listConversations }));
const { ConversationScreen } = await import('./conversation-screen');

const jade = {
  id: 'c1',
  agent: {
    slug: 'jade',
    name: 'Jade',
    initials: 'J',
    roleFr: 'Amie du quotidien',
    category: 'Quotidien',
  },
  lastMessage: null,
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  listConversations.mockResolvedValue([jade]);
});
afterEach(cleanup);

describe('ConversationScreen', () => {
  it('renvoie vers l’accueil sans session', async () => {
    ensureSession.mockResolvedValue(null);
    render(<ConversationScreen agentSlug="jade" />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  it('montre l’en-tête du contact et un retour vers les discussions', async () => {
    render(<ConversationScreen agentSlug="jade" />);
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toContain('Jade');
    expect(screen.getByText('AMIE DU QUOTIDIEN', { exact: false })).toBeTruthy();
    expect(screen.getByRole('link', { name: fr.conversation.back }).getAttribute('href')).toBe(
      '/chats',
    );
    expect(screen.getByText(fr.conversation.soon)).toBeTruthy();
  });

  it('signale un contact inconnu', async () => {
    render(<ConversationScreen agentSlug="nobody" />);
    expect(await screen.findByText(fr.conversation.notFound)).toBeTruthy();
  });

  it('signale une erreur de chargement', async () => {
    listConversations.mockRejectedValue(new Error('x'));
    render(<ConversationScreen agentSlug="jade" />);
    expect((await screen.findByRole('alert')).textContent).toBe(fr.chats.error);
  });
});
