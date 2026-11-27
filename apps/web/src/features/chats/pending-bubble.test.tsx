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

  it('montre la photo en cours d’envoi', () => {
    URL.createObjectURL = vi.fn(() => 'blob:photo');
    URL.revokeObjectURL = vi.fn();
    const photo = new Blob(['x'], { type: 'image/jpeg' });
    render(
      <ol>
        <PendingBubble
          message={{ clientId: 'a', text: '', status: 'sending', photo }}
          onRetry={vi.fn()}
        />
      </ol>,
    );
    expect(screen.getByRole('img', { name: c.photo }).getAttribute('src')).toBe('blob:photo');
    expect(screen.getByRole('status').textContent).toBe(c.sending);
  });

  it('montre le vocal en cours d’envoi avec sa durée', () => {
    render(
      <ol>
        <PendingBubble
          message={{
            clientId: 'a',
            text: '',
            status: 'sending',
            voice: { blob: new Blob(['x']), seconds: 64 },
          }}
          onRetry={vi.fn()}
        />
      </ol>,
    );
    expect(screen.getByText('Message vocal, 1:04')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(c.sending);
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
