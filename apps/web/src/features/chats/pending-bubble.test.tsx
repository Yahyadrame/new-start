import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { PendingBubble } from './pending-bubble';

afterEach(cleanup);
const c = fr.conversation;

describe('PendingBubble', () => {
  it('annonce l’envoi en cours, sans bouton', () => {
    render(
      <ol>
        <PendingBubble
          message={{ clientId: 'a', text: 'Hi', status: 'sending' }}
          onRetry={vi.fn()}
        />
      </ol>,
    );
    expect(screen.getByText('Hi')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(c.sending);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('montre un sticker en cours d’envoi comme un sticker', () => {
    render(
      <ol>
        <PendingBubble
          message={{ clientId: 'a', text: 'Hello!', status: 'sending', sticker: 'hello' }}
          onRetry={vi.fn()}
        />
      </ol>,
    );
    expect(screen.getByRole('img', { name: 'Hello!' })).toBeTruthy();
  });

  it('propose de réessayer quand le message n’est pas parti', () => {
    const onRetry = vi.fn();
    render(
      <ol>
        <PendingBubble
          message={{ clientId: 'a', text: 'Hi', status: 'failed' }}
          onRetry={onRetry}
        />
      </ol>,
    );
    fireEvent.click(screen.getByRole('button', { name: c.sendFailed }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
