import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import Page from './page';

afterEach(cleanup);

describe('/terms', () => {
  it('affiche le texte avec son titre', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(fr.legal.terms.title);
  });
});
