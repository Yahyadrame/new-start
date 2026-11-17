import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setSession } from '../../../shared/auth/session';
import fr from '../../../shared/i18n/fr.json';

afterEach(cleanup);
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
const { default: LevelPage } = await import('./page');

describe('/onboarding/level', () => {
  it("affiche l'étape 3 et le test", () => {
    setSession({
      accessToken: 'a',
      expiresInSeconds: 900,
      user: { id: 'u1', firstName: 'Awa', goal: 'WORK', level: 'A1' },
    });
    render(<LevelPage />);
    expect(screen.getByRole('img', { name: fr.level.stepLabel })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(fr.level.title);
  });
});
