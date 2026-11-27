import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { useVoiceAvailability } from './use-voice-availability';

const getVoiceAvailability = vi.hoisted(() => vi.fn());
vi.mock('./chats-api', () => ({ getVoiceAvailability }));

beforeEach(() => {
  vi.resetAllMocks();
  getVoiceAvailability.mockResolvedValue({ available: true });
});
afterEach(cleanup);

const token = { current: 'tok' };
const mount = (ready = true) =>
  renderHook((on: boolean) => useVoiceAvailability(token, on), { initialProps: ready });

describe('useVoiceAvailability', () => {
  it('attend que la conversation soit prête avant de demander', async () => {
    const { result, rerender } = mount(false);
    expect(getVoiceAvailability).not.toHaveBeenCalled();
    await act(async () => rerender(true));
    expect(getVoiceAvailability).toHaveBeenCalledWith('tok');
    expect(result.current.blocked).toBeNull();
  });

  it.each([
    ['disabled', fr.conversation.micBlocked.disabled],
    ['unconfigured', fr.conversation.micBlocked.unconfigured],
    ['quota', fr.conversation.micBlocked.quota],
  ])('donne la raison quand le micro est indisponible (%s)', async (reason, text) => {
    getVoiceAvailability.mockResolvedValue({ available: false, reason });
    const { result } = mount();
    await waitFor(() => expect(result.current.blocked).toBe(text));
  });

  it('laisse le micro actif quand l’appel échoue', async () => {
    getVoiceAvailability.mockRejectedValue(new Error('réseau'));
    const { result } = mount();
    await act(async () => undefined);
    expect(result.current.blocked).toBeNull();
  });

  it('relit l’état à la demande, et garde le dernier connu si l’appel échoue', async () => {
    const { result } = mount();
    await act(async () => undefined);
    getVoiceAvailability.mockResolvedValue({ available: false, reason: 'quota' });
    await act(() => result.current.refresh());
    expect(result.current.blocked).toBe(fr.conversation.micBlocked.quota);
    getVoiceAvailability.mockRejectedValue(new Error('réseau'));
    await act(() => result.current.refresh());
    expect(result.current.blocked).toBe(fr.conversation.micBlocked.quota);
    getVoiceAvailability.mockResolvedValue({ available: true });
    await act(() => result.current.refresh());
    expect(result.current.blocked).toBeNull();
  });
});
