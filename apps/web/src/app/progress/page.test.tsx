import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);
vi.mock('../../features/progress', () => ({ ProgressScreen: () => <p>écran progrès</p> }));
const { default: Page } = await import('./page');

describe('/progress', () => {
  it('affiche l’écran Progrès', () => {
    expect(render(<Page />).getByText('écran progrès')).toBeTruthy();
  });
});
