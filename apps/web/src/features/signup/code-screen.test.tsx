import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

afterEach(cleanup);
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
const { CodeScreen } = await import('./code-screen');

describe('CodeScreen', () => {
  it("annonce l'étape 2 et ramène à l'inscription", () => {
    render(<CodeScreen />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(fr.code.title);
    expect(screen.getByRole('link', { name: fr.code.back }).getAttribute('href')).toBe('/signup');
    expect(screen.getByRole('img', { name: fr.code.stepLabel })).toBeTruthy();
  });
});
