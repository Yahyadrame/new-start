import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SplashScreen } from './splash-screen';

const matchMedia = (reduced: boolean) =>
  vi
    .fn()
    .mockReturnValue({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() });

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal('matchMedia', matchMedia(false));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const splash = () => screen.queryByTestId('splash');
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('SplashScreen', () => {
  it('joue 2,7 s à la première ouverture puis disparaît du DOM', () => {
    render(<SplashScreen />);
    expect(splash()?.className).toContain('first');
    advance(2699);
    expect(splash()).not.toBeNull();
    advance(1);
    advance(200);
    expect(splash()).toBeNull();
    expect(localStorage.getItem('ns.firstLaunchDone')).toBe('1');
  });

  it('joue 1,3 s ensuite', () => {
    localStorage.setItem('ns.firstLaunchDone', '1');
    render(<SplashScreen />);
    expect(splash()?.className).not.toContain('first');
    advance(1300);
    advance(200);
    expect(splash()).toBeNull();
  });

  it("ne se rejoue pas dans la même ouverture de l'appli", () => {
    sessionStorage.setItem('ns.splashShown', '1');
    render(<SplashScreen />);
    expect(splash()).toBeNull();
  });

  it('ne se joue pas quand le réglage « off » est posé', () => {
    localStorage.setItem('ns.splash', 'off');
    render(<SplashScreen />);
    expect(splash()).toBeNull();
  });

  it('est sautée par un toucher, Entrée ou Échap', () => {
    render(<SplashScreen />);
    fireEvent.pointerDown(splash() as HTMLElement);
    advance(200);
    expect(splash()).toBeNull();

    cleanup();
    sessionStorage.clear();
    render(<SplashScreen />);
    fireEvent.keyDown(window, { key: 'Escape' });
    advance(200);
    expect(splash()).toBeNull();
  });

  it('dure 0,4 s quand les animations sont réduites', () => {
    vi.stubGlobal('matchMedia', matchMedia(true));
    render(<SplashScreen />);
    advance(400);
    advance(200);
    expect(splash()).toBeNull();
  });

  it('expose un nom accessible et joue quand le stockage est bloqué', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqué');
    });
    render(<SplashScreen />);
    expect(screen.getByRole('img', { name: 'New Start' })).toBeTruthy();
    vi.restoreAllMocks();
  });
});
