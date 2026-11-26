import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { EMOJIS, EmojiPanel } from './emoji-panel';

afterEach(cleanup);

describe('EmojiPanel', () => {
  it('propose une quarantaine d’émojis, tous entiers', () => {
    expect(EMOJIS.length).toBeGreaterThan(35);
    expect(new Set(EMOJIS).size).toBe(EMOJIS.length);
  });

  it('envoie l’émoji touché', () => {
    const onPick = vi.fn();
    render(<EmojiPanel onPick={onPick} />);
    fireEvent.click(
      screen.getByRole('button', { name: fr.conversation.emojiInsert.replace('{emoji}', '👍') }),
    );
    expect(onPick).toHaveBeenCalledWith('👍');
  });
});
