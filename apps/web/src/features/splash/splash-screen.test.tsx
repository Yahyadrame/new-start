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

  it('se rejoue à chaque rechargement de la page', () => {
    render(<SplashScreen />);
    advance(2700);
    advance(200);
    expect(splash()).toBeNull();
    cleanup();
    render(<SplashScreen />);
    expect(splash()?.className).toContain('play');
    expect(splash()?.className).not.toContain('first');
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

  describe('retour dans l’appli', () => {
    const setVisibility = (state: 'hidden' | 'visible') => {
      Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
      act(() => void document.dispatchEvent(new Event('visibilitychange')));
    };
    const playOnce = () => {
      render(<SplashScreen />);
      advance(2700);
      advance(200);
      expect(splash()).toBeNull();
    };
    afterEach(() => setVisibility('visible'));

    it('se rejoue (piste courte) après 5 minutes en arrière-plan', () => {
      playOnce();
      setVisibility('hidden');
      advance(5 * 60 * 1000);
      setVisibility('visible');
      expect(splash()?.className).toContain('play');
      expect(splash()?.className).not.toContain('first');
      advance(1300);
      advance(200);
      expect(splash()).toBeNull();
    });

    it('ne se rejoue pas après une absence courte', () => {
      playOnce();
      setVisibility('hidden');
      advance(4 * 60 * 1000);
      setVisibility('visible');
      expect(splash()).toBeNull();
    });

    it('ne se rejoue pas quand le réglage « off » est posé', () => {
      playOnce();
      localStorage.setItem('ns.splash', 'off');
      setVisibility('hidden');
      advance(6 * 60 * 1000);
      setVisibility('visible');
      expect(splash()).toBeNull();
    });

    it('ne coupe pas l’animation en cours quand l’appli revient au premier plan', () => {
      render(<SplashScreen />);
      setVisibility('hidden');
      advance(6 * 60 * 1000);
      setVisibility('visible');
      expect(splash()?.className).toContain('first');
    });

    it('se rejoue au retour depuis le cache du navigateur (pageshow)', () => {
      playOnce();
      act(() => void window.dispatchEvent(new Event('pagehide')));
      advance(5 * 60 * 1000);
      act(() => {
        const e = new Event('pageshow') as PageTransitionEvent;
        Object.defineProperty(e, 'persisted', { value: true });
        window.dispatchEvent(e);
      });
      expect(splash()?.className).toContain('play');
    });
  });
});
