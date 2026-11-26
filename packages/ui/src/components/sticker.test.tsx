import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Sticker } from './sticker';

afterEach(cleanup);

describe('Sticker', () => {
  it('affiche une image nommée par la légende, en URI de données', () => {
    render(<Sticker parts={['happy', 'none', 'smile', 'none']} alt="Thanks!" />);
    const img = screen.getByRole('img', { name: 'Thanks!' });
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml,/);
  });

  it('prend la classe donnée', () => {
    const { container } = render(
      <Sticker parts={['dot', 'none', 'flat', 'none']} alt="Hmm…" className="size-32" />,
    );
    expect(container.querySelector('img')?.className).toContain('size-32');
  });
});
