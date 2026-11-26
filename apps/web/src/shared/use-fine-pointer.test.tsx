import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFinePointer } from './use-fine-pointer';

afterEach(() => vi.unstubAllGlobals());

const media = (matches: boolean) =>
  vi.stubGlobal('matchMedia', () => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

describe('useFinePointer', () => {
  it('est vrai avec une souris', () => {
    media(true);
    expect(renderHook(() => useFinePointer()).result.current).toBe(true);
  });

  it('est faux sur un écran tactile', () => {
    media(false);
    expect(renderHook(() => useFinePointer()).result.current).toBe(false);
  });

  it('est faux quand le navigateur ne sait pas répondre', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(renderHook(() => useFinePointer()).result.current).toBe(false);
  });
});
