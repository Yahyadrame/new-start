import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { keyboardInset, useKeyboardInset } from './use-keyboard-inset';

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.style.removeProperty('--kb');
});

describe('keyboardInset', () => {
  it('rend la hauteur cachée sous la zone visible', () => {
    vi.stubGlobal('innerHeight', 800);
    expect(keyboardInset({ height: 500, offsetTop: 0 })).toBe(300);
    expect(keyboardInset({ height: 500, offsetTop: 40 })).toBe(260);
  });
  it('ne descend jamais sous zéro', () => {
    vi.stubGlobal('innerHeight', 800);
    expect(keyboardInset({ height: 810, offsetTop: 0 })).toBe(0);
  });
});

describe('useKeyboardInset', () => {
  it('pose --kb, la met à jour quand le clavier bouge, puis la retire', () => {
    vi.stubGlobal('innerHeight', 800);
    const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0 });
    vi.stubGlobal('visualViewport', viewport);
    const { unmount } = renderHook(() => useKeyboardInset());
    const kb = () => document.documentElement.style.getPropertyValue('--kb');
    expect(kb()).toBe('0px');
    viewport.height = 480;
    viewport.dispatchEvent(new Event('resize'));
    expect(kb()).toBe('320px');
    unmount();
    expect(kb()).toBe('');
  });
  it('ne fait rien sans visualViewport', () => {
    vi.stubGlobal('visualViewport', undefined);
    renderHook(() => useKeyboardInset());
    expect(document.documentElement.style.getPropertyValue('--kb')).toBe('');
  });
});
