import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

const enable = vi.fn();
let state: { status: string | null; busy: boolean; failed: boolean };
vi.mock('../../shared/push/use-push', () => ({ usePush: () => ({ ...state, enable }) }));
const { PushBanner } = await import('./push-banner');

const t = fr.push;

beforeEach(() => {
  vi.clearAllMocks();
  state = { status: 'off', busy: false, failed: false };
});
afterEach(cleanup);

describe('PushBanner', () => {
  it('propose d’activer quand l’appareil ne reçoit pas encore les rappels', () => {
    render(<PushBanner />);
    expect(screen.getByRole('heading', { name: t.bannerTitle })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t.bannerAction }));
    expect(enable).toHaveBeenCalledTimes(1);
  });

  it('ne demande rien tant qu’on ne clique pas', () => {
    render(<PushBanner />);
    expect(enable).not.toHaveBeenCalled();
  });

  it.each(['on', 'blocked', 'unsupported', 'unconfigured', null])(
    'reste caché quand l’état est %s',
    (status) => {
      state.status = status;
      const { container } = render(<PushBanner />);
      expect(container.firstChild).toBeNull();
    },
  );

  it('désactive le bouton pendant la demande', () => {
    state.busy = true;
    render(<PushBanner />);
    expect(
      (screen.getByRole('button', { name: t.bannerAction }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('annonce l’échec', () => {
    state.failed = true;
    render(<PushBanner />);
    expect(screen.getByRole('alert').textContent).toBe(t.failed);
  });
});
