import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const { default: SignupPage } = await import('./page');

describe('/signup', () => {
  it("affiche l'écran d'inscription", () => {
    render(<SignupPage />);
    expect(screen.getByRole('button', { name: 'Recevoir mon code' })).toBeTruthy();
  });
});
