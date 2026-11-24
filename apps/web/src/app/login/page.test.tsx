import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const { default: LoginPage } = await import('./page');

describe('/login', () => {
  it("affiche l'écran de connexion", () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: 'Recevoir mon code' })).toBeTruthy();
  });
});
