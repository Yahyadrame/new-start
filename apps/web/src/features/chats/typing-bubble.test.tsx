import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { TypingBubble } from './typing-bubble';

afterEach(cleanup);

describe('TypingBubble', () => {
  it('annonce que le contact écrit', () => {
    render(
      <ol>
        <TypingBubble name="Jade" />
      </ol>,
    );
    expect(screen.getByRole('status').textContent).toBe(
      fr.conversation.typing.replace('{name}', 'Jade'),
    );
  });
});
