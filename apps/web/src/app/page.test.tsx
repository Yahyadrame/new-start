import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import HomePage from './page';

afterEach(cleanup);

describe('HomePage', () => {
  it("affiche l'écran Bienvenue", () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Parle anglais. Pour de vrai.',
    );
    expect(screen.getByRole('link', { name: 'Commencer gratuitement' })).toBeTruthy();
  });
});
