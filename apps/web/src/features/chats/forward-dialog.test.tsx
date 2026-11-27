import type { ConversationItem } from '@newstart/shared';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { ChatsError } from './chats-api';
import { ForwardDialog } from './forward-dialog';

vi.mock('../../shared/avatar/contact-avatar', () => ({ ContactAvatar: () => null }));

const t = fr.conversation.forward;
const contact = (id: string, name: string) =>
  ({ id, agent: { slug: id, name } }) as ConversationItem;
const targets = [contact('c2', 'Léa'), contact('c3', 'Marc'), contact('c4', 'Awa')];

const box = (name: string) =>
  screen.getByRole<HTMLInputElement>('checkbox', { name: (label) => label.startsWith(name) });
const send = () => screen.getByRole<HTMLButtonElement>('button', { name: /^Transférer/ });
const show = (onPick = vi.fn().mockResolvedValue(undefined)) => {
  const onClose = vi.fn();
  render(<ForwardDialog text="Hello" targets={targets} onPick={onPick} onClose={onClose} />);
  return { onPick, onClose };
};

afterEach(cleanup);

describe('ForwardDialog', () => {
  it('montre le texte et un chargement tant que la liste arrive', () => {
    render(<ForwardDialog text="Hello" targets={undefined} onPick={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByText(t.title)).toBeTruthy();
  });

  it('le dit quand il n’y a pas d’autre conversation', () => {
    render(<ForwardDialog text="Hello" targets={[]} onPick={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(t.empty)).toBeTruthy();
  });

  it('n’envoie rien tant qu’aucune conversation n’est cochée', () => {
    show();
    expect(send().disabled).toBe(true);
    fireEvent.click(box('Léa'));
    expect(send().disabled).toBe(false);
    expect(send().textContent).toBe(t.sendCount.replace('{count}', '1'));
    fireEvent.click(box('Léa'));
    expect(send().disabled).toBe(true);
  });

  it('envoie à chaque conversation cochée, puis ferme', async () => {
    const { onPick, onClose } = show();
    fireEvent.click(box('Léa'));
    fireEvent.click(box('Awa'));
    fireEvent.click(send());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onPick.mock.calls.map(([target]) => target.id)).toEqual(['c2', 'c4']);
    const ids = onPick.mock.calls.map(([, clientId]) => clientId as string);
    expect(new Set(ids).size).toBe(2);
  });

  it('en cas d’échec partiel, ne renvoie que ce qui manque, avec le même identifiant', async () => {
    const onPick = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValue(undefined);
    const { onClose } = show(onPick);
    fireEvent.click(box('Léa'));
    fireEvent.click(box('Marc'));
    fireEvent.click(send());
    expect(await screen.findByText(t.failed.replace('{names}', 'Marc'))).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    expect(box('Léa').disabled).toBe(true);
    expect(screen.getByText(t.sent)).toBeTruthy();
    expect(box('Marc').checked).toBe(true);
    fireEvent.click(send());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onPick).toHaveBeenCalledTimes(3);
    expect(onPick.mock.calls[2]).toEqual(onPick.mock.calls[1]);
  });

  it('s’arrête à la limite du jour et le dit', async () => {
    const onPick = vi.fn().mockRejectedValue(new ChatsError(429, 'USAGE_LIMIT'));
    show(onPick);
    fireEvent.click(box('Léa'));
    fireEvent.click(box('Marc'));
    fireEvent.click(send());
    expect(await screen.findByText(t.limit.replace('{names}', 'Léa, Marc'))).toBeTruthy();
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['IMAGE', t.limitPhoto],
    ['AUDIO', t.limitVoice],
  ] as const)('nomme la limite du média transféré (%s)', async (media, message) => {
    const onPick = vi.fn().mockRejectedValue(new ChatsError(429, 'USAGE_LIMIT'));
    render(
      <ForwardDialog
        text="Photo"
        media={media}
        targets={targets}
        onPick={onPick}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(box('Léa'));
    fireEvent.click(send());
    expect(await screen.findByText(message.replace('{names}', 'Léa'))).toBeTruthy();
  });
});
