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
  ...over,
});
const show = (m: MessageItem, onAddToNotebook?: (id: string) => Promise<void>) =>
  render(
    <ol>
      <MessageBubble message={m} {...(onAddToNotebook && { onAddToNotebook })} />
    </ol>,
  );

describe('MessageBubble', () => {
  it('aligne un message du contact à gauche, sans correction', () => {
    show(message({ correction: { better: 'ignorée', whyFr: null } }));
    expect(screen.getByText('Hello there').className).toContain('bg-surface-2');
    expect(screen.queryByText(fr.conversation.natural)).toBeNull();
    expect(screen.getByRole('listitem').className).toContain('self-start');
  });

  it('aligne un message de la personne à droite', () => {
    show(message({ author: 'USER' }));
    expect(screen.getByText('Hello there').className).toContain('bg-accent');
    expect(screen.getByRole('listitem').className).toContain('self-end');
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
      expect(screen.queryByRole('button')).toBeNull();
      cleanup();
      show(message({ author: 'USER', correction: { better: null, whyFr: null } }), vi.fn());
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('garde la correction de ce message puis confirme', async () => {
      const add = vi.fn().mockResolvedValue(undefined);
      show(corrected, add);
      fireEvent.click(button());
      expect(add).toHaveBeenCalledWith('m9');
      expect(await screen.findByText(fr.conversation.addedToNotebook)).toBeTruthy();
      expect(screen.queryByRole('button')).toBeNull();
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
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('montre tout de suite une traduction déjà gardée', () => {
      render(
        <ol>
          <MessageBubble message={message({ translationFr: 'Salut' })} onTranslate={vi.fn()} />
        </ol>,
      );
      expect(screen.getByText('Salut')).toBeTruthy();
      expect(screen.queryByRole('button')).toBeNull();
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
      expect(screen.queryByRole('button')).toBeNull();
      cleanup();
      render(
        <ol>
          <MessageBubble message={message({ author: 'USER' })} onTranslate={vi.fn()} />
        </ol>,
      );
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  it('centre un message système, sans bulle ni heure', () => {
    show(message({ author: 'SYSTEM', text: 'Nouvelle conversation' }));
    expect(screen.getByText('Nouvelle conversation').className).toContain('self-center');
    expect(document.querySelector('time')).toBeNull();
  });
});
