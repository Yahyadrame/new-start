import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../../shared/i18n/fr.json';

afterEach(cleanup);
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
const { default: SignupCodePage } = await import('./page');

describe('/signup/code', () => {
  it("affiche l'écran du code", () => {
    render(<SignupCodePage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(fr.code.title);
  });
});
