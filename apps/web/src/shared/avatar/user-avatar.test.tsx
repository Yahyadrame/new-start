import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { UserAvatar } from './user-avatar';
import { readColorScheme } from './use-color-scheme';

let dark = false;
beforeAll(() => {
  window.matchMedia = ((q: string) => ({
    matches: dark,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  cleanup();
  dark = false;
  document.documentElement.removeAttribute('data-theme');
});

describe('UserAvatar', () => {
  it('affiche une silhouette grise sans choix enregistré', () => {
    render(<UserAvatar avatar={null} name="Awa" />);
    expect(screen.getByRole('img', { name: 'Awa' }).getAttribute('src')).toContain(
      'data:image/svg+xml',
    );
  });

  it('change avec la silhouette choisie', () => {
    const { rerender } = render(<UserAvatar avatar={{ id: 'a001' }} name="Awa" />);
    const first = screen.getByRole('img').getAttribute('src');
    rerender(<UserAvatar avatar={{ id: 'a002', variant: 'noir' }} name="Awa" />);
    expect(screen.getByRole('img').getAttribute('src')).not.toBe(first);
  });
});

describe('readColorScheme', () => {
  it("suit l'appareil, puis le thème forcé", () => {
    expect(readColorScheme()).toBe('light');
    dark = true;
    expect(readColorScheme()).toBe('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    expect(readColorScheme()).toBe('light');
  });
});
