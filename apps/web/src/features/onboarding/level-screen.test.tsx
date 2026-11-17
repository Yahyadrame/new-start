import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

afterEach(cleanup);
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
const { LevelScreen } = await import('./level-screen');

describe('LevelScreen', () => {
  it("annonce l'étape 3 sur 3", () => {
    render(<LevelScreen />);
    expect(screen.getByRole('img', { name: fr.level.stepLabel })).toBeTruthy();
  });
});
