import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { LegalPage } from './legal-page';

afterEach(cleanup);

describe('LegalPage', () => {
  it.each([fr.legal.terms, fr.legal.privacy])(
    'montre $title, la mention provisoire et chaque section',
    (doc) => {
      render(<LegalPage doc={doc} />);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(doc.title);
      expect(screen.getByText(fr.legal.draft)).toBeTruthy();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(doc.sections.length);
    },
  );

  it('propose un retour vers l’inscription', () => {
    render(<LegalPage doc={fr.legal.terms} />);
    expect(screen.getByRole('link', { name: fr.legal.back }).getAttribute('href')).toBe('/signup');
  });
});
