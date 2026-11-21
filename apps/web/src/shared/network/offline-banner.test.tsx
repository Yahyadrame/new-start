import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../i18n/fr.json';
import { OfflineBanner } from './offline-banner';

const setOnline = (value: boolean) =>
  vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(value);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('OfflineBanner', () => {
  it('ne montre rien quand le réseau est là', () => {
    setOnline(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('s’affiche au démarrage sans réseau', () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('status').textContent).toContain(fr.offline.title);
  });

  it('apparaît à la coupure et disparaît au retour du réseau', () => {
    setOnline(true);
    render(<OfflineBanner />);
    setOnline(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByRole('status')).toBeTruthy();
    setOnline(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
