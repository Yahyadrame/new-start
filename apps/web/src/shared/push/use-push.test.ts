import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ensureSession = vi.fn();
const getPushStatus = vi.fn();
const enablePush = vi.fn();
const disablePush = vi.fn();
vi.mock('../auth/session', () => ({ ensureSession }));
vi.mock('./subscription', () => ({ getPushStatus, enablePush, disablePush }));
const { usePush } = await import('./use-push');

beforeEach(() => {
  vi.clearAllMocks();
  ensureSession.mockResolvedValue({ accessToken: 'tok' });
  getPushStatus.mockResolvedValue('off');
});

describe('usePush', () => {
  it('lit l’état de l’appareil au chargement, sans rien demander', async () => {
    const { result } = renderHook(() => usePush());
    expect(result.current.status).toBeNull();
    await waitFor(() => expect(result.current.status).toBe('off'));
    expect(enablePush).not.toHaveBeenCalled();
  });

  it('active avec le jeton de la session et passe à on', async () => {
    enablePush.mockResolvedValue('on');
    const { result } = renderHook(() => usePush());
    await waitFor(() => expect(result.current.status).toBe('off'));
    await act(() => result.current.enable());
    expect(enablePush).toHaveBeenCalledWith('tok');
    expect(result.current.status).toBe('on');
    expect(result.current.failed).toBe(false);
    expect(result.current.busy).toBe(false);
  });

  it('suit le résultat quand la personne refuse', async () => {
    enablePush.mockResolvedValue('blocked');
    const { result } = renderHook(() => usePush());
    await waitFor(() => expect(result.current.status).toBe('off'));
    await act(() => result.current.enable());
    expect(result.current.status).toBe('blocked');
  });

  it('désactive avec le jeton de la session', async () => {
    getPushStatus.mockResolvedValue('on');
    disablePush.mockResolvedValue('off');
    const { result } = renderHook(() => usePush());
    await waitFor(() => expect(result.current.status).toBe('on'));
    await act(() => result.current.disable());
    expect(disablePush).toHaveBeenCalledWith('tok');
    expect(result.current.status).toBe('off');
  });

  it('garde l’état et signale l’échec, puis l’efface à l’essai suivant', async () => {
    enablePush.mockResolvedValueOnce('failed').mockResolvedValueOnce('on');
    const { result } = renderHook(() => usePush());
    await waitFor(() => expect(result.current.status).toBe('off'));
    await act(() => result.current.enable());
    expect(result.current.status).toBe('off');
    expect(result.current.failed).toBe(true);
    await act(() => result.current.enable());
    expect(result.current.failed).toBe(false);
    expect(result.current.status).toBe('on');
  });

  it('signale l’échec sans appeler le navigateur quand la session est perdue', async () => {
    ensureSession.mockResolvedValue(null);
    const { result } = renderHook(() => usePush());
    await waitFor(() => expect(result.current.status).toBe('off'));
    await act(() => result.current.enable());
    expect(enablePush).not.toHaveBeenCalled();
    expect(result.current.failed).toBe(true);
  });
});
