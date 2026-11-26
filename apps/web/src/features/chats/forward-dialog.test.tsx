import type { ConversationItem } from '@newstart/shared';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { ForwardDialog } from './forward-dialog';

vi.mock('../../shared/avatar/contact-avatar', () => ({ ContactAvatar: () => null }));

const t = fr.conversation.forward;
const target = { id: 'c2', agent: { slug: 'lea', name: 'Léa' } } as ConversationItem;

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

  it('ferme après l’envoi', async () => {
    const onPick = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<ForwardDialog text="Hello" targets={[target]} onPick={onPick} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Léa/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onPick).toHaveBeenCalledWith(target);
  });

  it('reste ouvert et prévient quand l’envoi échoue', async () => {
    const onClose = vi.fn();
    render(
      <ForwardDialog
        text="Hello"
        targets={[target]}
        onPick={() => Promise.reject(new Error('x'))}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Léa/ }));
    expect(await screen.findByText(t.failed)).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
