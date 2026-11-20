import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

vi.mock('../../features/explore', () => ({ ExploreScreen: () => <p>écran explorer</p> }));
const { default: ExplorePage } = await import('./page');

it("affiche l'écran Explorer", () => {
  expect(render(<ExplorePage />).getByText('écran explorer')).toBeTruthy();
});
