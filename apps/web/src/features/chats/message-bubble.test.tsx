import type { MessageItem } from '@newstart/shared';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
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
const show = (m: MessageItem) =>
  render(
    <ol>
      <MessageBubble message={m} />
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

  it('centre un message système, sans bulle ni heure', () => {
    show(message({ author: 'SYSTEM', text: 'Nouvelle conversation' }));
    expect(screen.getByText('Nouvelle conversation').className).toContain('self-center');
    expect(document.querySelector('time')).toBeNull();
  });
});
