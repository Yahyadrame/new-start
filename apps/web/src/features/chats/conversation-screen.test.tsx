import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const replace = vi.fn();
const ensureSession = vi.fn();
const listConversations = vi.fn();
const listMessages = vi.fn();
const sendMessage = vi.fn();
const markConversationRead = vi.fn();
const addToNotebook = vi.fn();
const scrollIntoView = vi.fn();
const router = { replace };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../../shared/auth/session', () => ({ ensureSession }));
vi.mock('./chats-api', () => ({
  listConversations,
  listMessages,
  sendMessage,
  markConversationRead,
  addToNotebook,
}));
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

const msg = (id: string, author: 'USER' | 'AGENT', text: string) => ({
  id,
  author,
  text,
  translationFr: null,
  createdAt: '2026-11-20T10:00:00.000Z',
  correction: null,
});
// La bulle « en train d'écrire… » est testée à part : ici, seulement les messages.
const texts = () =>
  screen
    .getAllByRole('listitem')
    .map((li) => li.querySelector('p'))
    .filter((p) => p?.getAttribute('role') !== 'status')
    .map((p) => p?.textContent);

beforeEach(() => {
  vi.clearAllMocks();
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  listConversations.mockResolvedValue([jade]);
  listMessages.mockResolvedValue({
    items: [msg('m2', 'AGENT', 'Second'), msg('m1', 'USER', 'First')],
    nextCursor: null,
  });
  markConversationRead.mockResolvedValue(undefined);
  Element.prototype.scrollIntoView = scrollIntoView;
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
  });

  it('signale un contact inconnu', async () => {
    render(<ConversationScreen agentSlug="nobody" />);
    expect(await screen.findByText(fr.conversation.notFound)).toBeTruthy();
  });

  it('signale une erreur de chargement', async () => {
    listConversations.mockRejectedValue(new Error('x'));
    render(<ConversationScreen agentSlug="jade" />);
    expect((await screen.findByRole('alert')).textContent).toContain(fr.chats.error);
  });

  it('montre les messages du plus ancien au plus récent et descend au dernier', async () => {
    render(<ConversationScreen agentSlug="jade" />);
    await screen.findByRole('list', { name: fr.conversation.messagesLabel });
    expect(texts()).toEqual(['First', 'Second']);
    expect(listMessages).toHaveBeenCalledWith('tok', 'c1');
    expect(screen.queryByRole('button', { name: fr.conversation.older })).toBeNull();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
  });

  it('dit quand la conversation est vide', async () => {
    listMessages.mockResolvedValue({ items: [], nextCursor: null });
    render(<ConversationScreen agentSlug="jade" />);
    expect(await screen.findByText(fr.conversation.empty)).toBeTruthy();
  });

  it('charge les messages plus anciens au-dessus, sans redescendre', async () => {
    listMessages
      .mockResolvedValueOnce({ items: [msg('m2', 'AGENT', 'Second')], nextCursor: 'cur1' })
      .mockResolvedValueOnce({ items: [msg('m1', 'USER', 'First')], nextCursor: null });
    render(<ConversationScreen agentSlug="jade" />);
    fireEvent.click(await screen.findByRole('button', { name: fr.conversation.older }));
    await waitFor(() => expect(texts()).toEqual(['First', 'Second']));
    expect(listMessages).toHaveBeenLastCalledWith('tok', 'c1', 'cur1');
    expect(screen.queryByRole('button', { name: fr.conversation.older })).toBeNull();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('signale l’échec du chargement des messages plus anciens et garde ce qui est affiché', async () => {
    listMessages
      .mockResolvedValueOnce({ items: [msg('m2', 'AGENT', 'Second')], nextCursor: 'cur1' })
      .mockRejectedValueOnce(new Error('x'));
    render(<ConversationScreen agentSlug="jade" />);
    fireEvent.click(await screen.findByRole('button', { name: fr.conversation.older }));
    expect((await screen.findByRole('alert')).textContent).toBe(fr.conversation.olderError);
    expect(texts()).toEqual(['Second']);
  });

  it('propose de réessayer quand l’historique ne charge pas', async () => {
    listMessages.mockRejectedValueOnce(new Error('x'));
    render(<ConversationScreen agentSlug="jade" />);
    expect((await screen.findByRole('alert')).textContent).toContain(fr.conversation.messagesError);
    fireEvent.click(screen.getByRole('button', { name: fr.conversation.retry }));
    await screen.findByRole('list', { name: fr.conversation.messagesLabel });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  describe('envoi', () => {
    const write = async (text: string) => {
      const field = await screen.findByLabelText(fr.conversation.composerLabel);
      fireEvent.change(field, { target: { value: text } });
      fireEvent.submit(field.closest('form') as HTMLFormElement);
    };

    it('montre le message en cours d’envoi, puis le message enregistré', async () => {
      let resolve: (m: unknown) => void = () => undefined;
      sendMessage.mockReturnValue(new Promise((r) => (resolve = r)));
      render(<ConversationScreen agentSlug="jade" />);
      await write('Hello');
      expect(screen.getByRole('status').textContent).toBe(fr.conversation.sending);
      const [, call] = [0, sendMessage.mock.calls[0]];
      expect(call?.slice(0, 2)).toEqual(['tok', 'c1']);
      expect(call?.[2]).toMatchObject({ text: 'Hello' });
      expect(call?.[2].clientId).toMatch(/^[0-9a-f-]{36}$/);
      resolve(msg('m3', 'USER', 'Hello'));
      await waitFor(() => expect(screen.queryByText(fr.conversation.sending)).toBeNull());
      expect(texts()).toEqual(['First', 'Second', 'Hello']);
    });

    it('propose de réessayer avec le même clientId quand le message n’est pas parti', async () => {
      sendMessage
        .mockRejectedValueOnce(new Error('réseau'))
        .mockResolvedValueOnce(msg('m3', 'USER', 'Hello'));
      render(<ConversationScreen agentSlug="jade" />);
      await write('Hello');
      fireEvent.click(await screen.findByRole('button', { name: fr.conversation.sendFailed }));
      await waitFor(() => expect(texts()).toEqual(['First', 'Second', 'Hello']));
      expect(screen.queryByRole('button', { name: fr.conversation.sendFailed })).toBeNull();
      expect(sendMessage).toHaveBeenCalledTimes(2);
      expect(sendMessage.mock.calls[1]?.[2]).toEqual(sendMessage.mock.calls[0]?.[2]);
    });

    it('descend au message envoyé', async () => {
      sendMessage.mockResolvedValue(msg('m3', 'USER', 'Hello'));
      render(<ConversationScreen agentSlug="jade" />);
      await write('Hello');
      await waitFor(() => expect(scrollIntoView.mock.calls.length).toBeGreaterThan(1));
    });
  });
  describe('carnet', () => {
    it('garde la correction du message avec le jeton de la session', async () => {
      addToNotebook.mockResolvedValue(undefined);
      listMessages.mockResolvedValue({
        items: [
          {
            ...msg('m7', 'USER', 'I go home'),
            correction: { better: 'I went home', whyFr: null },
          },
        ],
        nextCursor: null,
      });
      render(<ConversationScreen agentSlug="jade" />);
      fireEvent.click(await screen.findByRole('button', { name: fr.conversation.addToNotebook }));
      await waitFor(() => expect(addToNotebook).toHaveBeenCalledWith('tok', 'm7'));
    });
  });
  describe('conversation lue', () => {
    it('la marque lue à l’ouverture quand des messages ne sont pas lus', async () => {
      listConversations.mockResolvedValue([{ ...jade, unreadCount: 2 }]);
      render(<ConversationScreen agentSlug="jade" />);
      await screen.findByText('Second');
      expect(markConversationRead).toHaveBeenCalledWith('tok', 'c1');
    });

    it('ne fait aucun appel quand tout est déjà lu', async () => {
      render(<ConversationScreen agentSlug="jade" />);
      await screen.findByText('Second');
      expect(markConversationRead).not.toHaveBeenCalled();
    });

    it('garde l’écran quand l’appel échoue', async () => {
      listConversations.mockResolvedValue([{ ...jade, unreadCount: 1 }]);
      markConversationRead.mockRejectedValue(new Error('x'));
      render(<ConversationScreen agentSlug="jade" />);
      expect(await screen.findByText('Second')).toBeTruthy();
      expect(screen.queryByText(fr.conversation.messagesError)).toBeNull();
    });
  });

  describe('réponse du contact', () => {
    const write = async (text: string) => {
      const field = await screen.findByLabelText(fr.conversation.composerLabel);
      fireEvent.change(field, { target: { value: text } });
      fireEvent.submit(field.closest('form') as HTMLFormElement);
    };
    const typing = fr.conversation.typing.replace('{name}', 'Jade');
    const sent = { ...msg('m3', 'USER', 'Hello'), createdAt: '2026-11-20T10:01:00.000Z' };
    const reply = { ...msg('m4', 'AGENT', 'Hi there'), createdAt: '2026-11-20T10:01:03.000Z' };
    const corrected = { ...sent, correction: { better: 'Hello!', whyFr: 'Plus naturel' } };
    const tick = (ms: number) =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });

    // Seuls les intervalles sont simulés : waitFor et findBy continuent de fonctionner.
    beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }));
    afterEach(() => vi.useRealTimers());

    const sendHello = async () => {
      sendMessage.mockResolvedValue(sent);
      render(<ConversationScreen agentSlug="jade" />);
      await write('Hello');
      await screen.findByText(typing);
      listMessages.mockClear();
    };

    it('montre « en train d’écrire… » après l’envoi, puis la réponse et la correction', async () => {
      await sendHello();
      listMessages.mockResolvedValue({ items: [reply, corrected], nextCursor: null });
      await tick(2000);
      await waitFor(() => expect(screen.queryByText(typing)).toBeNull());
      expect(screen.getByText('Hi there')).toBeTruthy();
      expect(screen.getByText('Hello!')).toBeTruthy();
      expect(screen.getAllByText('Hello')).toHaveLength(1);
      expect(markConversationRead).toHaveBeenCalledWith('tok', 'c1');
    });

    it('continue de relire tant que le contact n’a pas répondu', async () => {
      await sendHello();
      listMessages.mockResolvedValue({ items: [sent], nextCursor: null });
      await tick(6000);
      expect(listMessages).toHaveBeenCalledTimes(3);
      expect(screen.getByText(typing)).toBeTruthy();
    });

    it('s’arrête au bout de 60 s sans réponse', async () => {
      await sendHello();
      listMessages.mockResolvedValue({ items: [sent], nextCursor: null });
      // Un tour à la fois : React se rend entre deux tours et retire l'intervalle après le 30e appel.
      for (let i = 0; i < 35; i += 1) await tick(2000);
      expect(listMessages).toHaveBeenCalledTimes(30);
      expect(screen.queryByText(typing)).toBeNull();
    });

    it('réessaie au tour suivant quand une relecture échoue', async () => {
      await sendHello();
      listMessages
        .mockRejectedValueOnce(new Error('réseau'))
        .mockResolvedValue({ items: [reply, sent], nextCursor: null });
      await tick(4000);
      await waitFor(() => expect(screen.getByText('Hi there')).toBeTruthy());
      expect(listMessages).toHaveBeenCalledTimes(2);
    });

    it('n’attend rien quand le dernier message vient du contact', async () => {
      render(<ConversationScreen agentSlug="jade" />);
      await screen.findByText('Second');
      expect(screen.queryByText(typing)).toBeNull();
    });

    it('reprend l’attente à l’ouverture si le dernier message est tout récent et sans réponse', async () => {
      const fresh = { ...msg('m9', 'USER', 'Just sent'), createdAt: new Date().toISOString() };
      listMessages.mockResolvedValue({ items: [fresh], nextCursor: null });
      render(<ConversationScreen agentSlug="jade" />);
      expect(await screen.findByText(typing)).toBeTruthy();
    });

    it('n’attend pas non plus un message ancien resté sans réponse', async () => {
      listMessages.mockResolvedValue({ items: [sent], nextCursor: null });
      render(<ConversationScreen agentSlug="jade" />);
      await screen.findByText('Hello');
      expect(screen.queryByText(typing)).toBeNull();
    });
  });
});
