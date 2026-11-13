import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import HomePage from './page';

afterEach(cleanup);

describe('HomePage', () => {
  it('affiche le titre, les deux logos et le choix du thème', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Parle anglais. Pour de vrai.',
    );
    expect(screen.getAllByAltText('new start')).toHaveLength(2);
    expect(screen.getByRole('group', { name: 'Thème' })).toBeTruthy();
  });
});
