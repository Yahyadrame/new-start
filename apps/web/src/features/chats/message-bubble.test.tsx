import type { MessageItem } from '@newstart/shared';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { MessageBubble } from './message-bubble';

afterEach(cleanup);

const message = (over: Partial<MessageItem>): MessageItem => ({
  id: 'm1',
  author: 'AGENT',
  text: 'Hello there',
  translationFr: null,
  createdAt: '2026-11-20T10:00:00.000Z',
  correction: null,
  replyTo: null,
  edited: false,
  forwarded: false,
  deleted: false,
  ...over,
});
// Les boutons de la bulle, sans le menu d'actions qui est toujours là.
const buttons = () =>
  screen
    .queryAllByRole('button')
    .filter((b) => b.getAttribute('aria-label') !== fr.conversation.messageActions);
const show = (m: MessageItem, onAddToNotebook?: (id: string) => Promise<void>) =>
  render(
    <ol>
      <MessageBubble message={m} {...(onAddToNotebook && { onAddToNotebook })} />
    </ol>,
  );

describe('MessageBubble', () => {
  it('aligne un message du contact à gauche, sans correction', () => {
    show(message({ correction: { better: 'ignorée', whyFr: null } }));
    expect(screen.getByText('Hello there').parentElement?.className).toContain('bg-bg');
    expect(screen.queryByText(fr.conversation.natural)).toBeNull();
    expect(screen.getByRole('listitem').className).toContain('self-start');
    expect(screen.getByText('Hello there').parentElement?.className).toContain('rounded-bl-[6px]');
  });

  it('aligne un message de la personne à droite', () => {
    show(message({ author: 'USER' }));
    expect(screen.getByText('Hello there').parentElement?.className).toContain('bg-accent');
    expect(screen.getByRole('listitem').className).toContain('self-end');
    expect(screen.getByText('Hello there').parentElement?.className).toContain('rounded-br-[6px]');
  });

  it('montre la carte « Plus naturel » avec son explication', () => {
    show(
      message({
        author: 'USER',
        correction: { better: 'I went home.', whyFr: 'Le passé de go est went.' },
      }),
    );
    expect(screen.getByText(fr.conversation.natural)).toBeTruthy();
    expect(screen.getByText('I went home.')).toBeTruthy();
    expect(screen.getByText('Le passé de go est went.')).toBeTruthy();
  });

  it('ne montre que le mot « Rien à corriger » quand le message est déjà naturel', () => {
    show(message({ author: 'USER', correction: { better: null, whyFr: null } }));
    expect(screen.getByText(fr.conversation.perfect)).toBeTruthy();
    expect(screen.queryByText(fr.conversation.natural)).toBeNull();
  });

  describe('bouton « Ajouter au carnet »', () => {
    const corrected = message({
      id: 'm9',
      author: 'USER',
      correction: { better: 'I went home.', whyFr: null },
    });
    const button = () => screen.getByRole('button', { name: fr.conversation.addToNotebook });

    it("n'apparaît pas sans action fournie, ni quand rien n'est à corriger", () => {
      show(corrected);
      expect(buttons()).toHaveLength(0);
      cleanup();
      show(message({ author: 'USER', correction: { better: null, whyFr: null } }), vi.fn());
      expect(buttons()).toHaveLength(0);
    });

    it('garde la correction de ce message puis confirme', async () => {
      const add = vi.fn().mockResolvedValue(undefined);
      show(corrected, add);
      fireEvent.click(button());
      expect(add).toHaveBeenCalledWith('m9');
      expect(await screen.findByText(fr.conversation.addedToNotebook)).toBeTruthy();
      expect(buttons()).toHaveLength(0);
    });

    it("se désactive pendant l'ajout", async () => {
      let done: () => void = () => undefined;
      const add = vi.fn().mockReturnValue(new Promise<void>((r) => (done = r)));
      show(corrected, add);
      fireEvent.click(button());
      const busy = screen.getByRole('button', { name: fr.conversation.addingToNotebook });
      expect((busy as HTMLButtonElement).disabled).toBe(true);
      done();
      await screen.findByText(fr.conversation.addedToNotebook);
    });

    it('laisse réessayer après un échec', async () => {
      const add = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(undefined);
      show(corrected, add);
      fireEvent.click(button());
      const retry = await screen.findByRole('button', {
        name: fr.conversation.addToNotebookFailed,
      });
      fireEvent.click(retry);
      await waitFor(() => expect(screen.getByText(fr.conversation.addedToNotebook)).toBeTruthy());
      expect(add).toHaveBeenCalledTimes(2);
    });
  });

  describe('traduction', () => {
    const button = () => screen.getByRole('button', { name: fr.conversation.translate });

    it('traduit un message du contact au toucher', async () => {
      const translate = vi.fn().mockResolvedValue('Bonjour');
      render(
        <ol>
          <MessageBubble message={message({})} onTranslate={translate} />
        </ol>,
      );
      fireEvent.click(button());
      await waitFor(() => expect(screen.getByText('Bonjour')).toBeTruthy());
      expect(translate).toHaveBeenCalledWith('m1');
      expect(buttons()).toHaveLength(0);
    });

    it('montre tout de suite une traduction déjà gardée', () => {
      render(
        <ol>
          <MessageBubble message={message({ translationFr: 'Salut' })} onTranslate={vi.fn()} />
        </ol>,
      );
      expect(screen.getByText('Salut')).toBeTruthy();
      expect(buttons()).toHaveLength(0);
    });

    it('laisse réessayer après un échec', async () => {
      const translate = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue('Bonjour');
      render(
        <ol>
          <MessageBubble message={message({})} onTranslate={translate} />
        </ol>,
      );
      fireEvent.click(button());
      fireEvent.click(await screen.findByRole('button', { name: fr.conversation.translateFailed }));
      await waitFor(() => expect(screen.getByText('Bonjour')).toBeTruthy());
      expect(translate).toHaveBeenCalledTimes(2);
    });

    it('n’offre pas le bouton sans onTranslate, ni sur un message de la personne', () => {
      show(message({}));
      expect(buttons()).toHaveLength(0);
      cleanup();
      render(
        <ol>
          <MessageBubble message={message({ author: 'USER' })} onTranslate={vi.fn()} />
        </ol>,
      );
      expect(buttons()).toHaveLength(0);
    });
  });

  it('montre les doubles coches seulement sur les messages de la personne', () => {
    show(message({ author: 'USER' }));
    expect(document.querySelector('svg.lucide-check-check')).not.toBeNull();
    cleanup();
    show(message({}));
    expect(document.querySelector('svg.lucide-check-check')).toBeNull();
  });

  it('centre un message système, sans bulle ni heure', () => {
    show(message({ author: 'SYSTEM', text: 'Nouvelle conversation' }));
    expect(screen.getByText('Nouvelle conversation').className).toContain('self-center');
    expect(document.querySelector('time')).toBeNull();
  });

  it('porte un identifiant pour qu’on puisse s’y placer, et entoure la bulle quand on la retrouve', () => {
    const { rerender } = render(
      <ol>
        <MessageBubble message={message({ id: 'm7' })} />
      </ol>,
    );
    expect(screen.getByRole('listitem').id).toBe('message-m7');
    expect(screen.getByText('Hello there').parentElement?.className).not.toContain('ring-2');
    rerender(
      <ol>
        <MessageBubble message={message({ id: 'm7' })} highlighted />
      </ol>,
    );
    expect(screen.getByText('Hello there').parentElement?.className).toContain('ring-2');
  });

  const c = fr.conversation;
  const openMenu = (onDelete?: (id: string) => Promise<void>) => {
    render(
      <ol>
        <MessageBubble message={message({})} {...(onDelete && { onDelete })} />
      </ol>,
    );
    const trigger = screen.getByRole('button', { name: c.messageActions });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.click(trigger);
  };

  it('remplace un message supprimé par « Message supprimé », sans menu ni traduction', () => {
    show(message({ deleted: true, text: '' }));
    expect(screen.getByText(c.deleted)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('propose « Répondre » et rend le message au parent', async () => {
    const onReply = vi.fn();
    const m = message({});
    render(
      <ol>
        <MessageBubble message={m} onReply={onReply} />
      </ol>,
    );
    const trigger = screen.getByRole('button', { name: c.messageActions });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('button', { name: c.reply }));
    expect(onReply).toHaveBeenCalledWith(m);
  });

  it('propose « Transférer » et montre « transféré »', async () => {
    const onForward = vi.fn();
    const m = message({ author: 'AGENT', forwarded: true });
    render(
      <ol>
        <MessageBubble message={m} onForward={onForward} />
      </ol>,
    );
    expect(screen.getByText(c.forwarded)).toBeTruthy();
    const trigger = screen.getByRole('button', { name: c.messageActions });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('button', { name: c.forwardAction }));
    expect(onForward).toHaveBeenCalledWith(m);
  });

  it('propose « Modifier » sur ses messages seulement, et montre « modifié »', async () => {
    const onEdit = vi.fn();
    const mine = message({ author: 'USER', edited: true });
    const { unmount } = render(
      <ol>
        <MessageBubble message={mine} onEdit={onEdit} />
      </ol>,
    );
    expect(screen.getByText(c.edited)).toBeTruthy();
    const trigger = screen.getByRole('button', { name: c.messageActions });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('button', { name: c.edit }));
    expect(onEdit).toHaveBeenCalledWith(mine);
    unmount();
    render(
      <ol>
        <MessageBubble message={message({})} onEdit={onEdit} />
      </ol>,
    );
    const other = screen.getByRole('button', { name: c.messageActions });
    fireEvent.pointerDown(other, { button: 0, ctrlKey: false });
    fireEvent.click(other);
    await screen.findByRole('button', { name: c.copy });
    expect(screen.queryByRole('button', { name: c.edit })).toBeNull();
    expect(screen.queryByText(c.edited)).toBeNull();
  });

  it('cite le message auquel il répond, avec son auteur', () => {
    const replyTo = { id: 'm0', author: 'USER' as const, text: 'See you', deleted: false };
    show(message({ replyTo }));
    expect(screen.getByText(c.quoteYou)).toBeTruthy();
    expect(screen.getByText('See you')).toBeTruthy();
  });

  it('montre « Message supprimé » quand le message cité a été effacé', () => {
    const replyTo = { id: 'm0', author: 'AGENT' as const, text: '', deleted: true };
    render(
      <ol>
        <MessageBubble message={message({ author: 'USER', replyTo })} agentName="Jade" />
      </ol>,
    );
    expect(screen.getByText('Jade')).toBeTruthy();
    expect(screen.getByText(c.deleted)).toBeTruthy();
  });

  it('copie le texte du message', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    openMenu();
    fireEvent.click(await screen.findByRole('button', { name: c.copy }));
    expect(writeText).toHaveBeenCalledWith('Hello there');
    expect((await screen.findByRole('status')).textContent).toBe(c.copied);
    expect(screen.queryByRole('button', { name: c.delete })).toBeNull();
  });

  it('dit quand la copie échoue', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) } });
    openMenu();
    fireEvent.click(await screen.findByRole('button', { name: c.copy }));
    expect((await screen.findByRole('status')).textContent).toBe(c.copyFailed);
  });

  it('demande confirmation avant de supprimer, puis supprime', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    openMenu(onDelete);
    fireEvent.click(await screen.findByRole('button', { name: c.delete }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: c.deleteCancel }));
    expect(screen.getByRole('button', { name: c.delete })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: c.delete }));
    fireEvent.click(screen.getByRole('button', { name: c.deleteConfirm }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('m1'));
    await waitFor(() => expect(screen.queryByRole('button', { name: c.deleteConfirm })).toBeNull());
  });

  it('garde le menu ouvert et le dit quand la suppression échoue', async () => {
    openMenu(vi.fn().mockRejectedValue(new Error()));
    fireEvent.click(await screen.findByRole('button', { name: c.delete }));
    fireEvent.click(screen.getByRole('button', { name: c.deleteConfirm }));
    expect((await screen.findByRole('status')).textContent).toBe(c.deleteFailed);
    expect(
      (screen.getByRole('button', { name: c.deleteConfirm }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });
});
