import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canRecord, MAX_RECORDING_MS, useRecorder } from './use-recorder';

const track = { stop: vi.fn() };
class FakeRecorder {
  static last: FakeRecorder;
  state = 'inactive';
  mimeType = 'audio/webm';
  stream = { getTracks: () => [track] };
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor() {
    FakeRecorder.last = this;
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['abc']) });
    this.onstop?.();
  }
}
const getUserMedia = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  getUserMedia.mockResolvedValue({});
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useRecorder', () => {
  it('enregistre puis rend l’audio et libère le micro', async () => {
    const { result } = renderHook(() => useRecorder());
    expect(await act(() => result.current.start())).toBe(true);
    expect(result.current.recording).toBe(true);
    const blob = await act(() => result.current.stop());
    expect(blob?.size).toBe(3);
    expect(result.current.recording).toBe(false);
    expect(track.stop).toHaveBeenCalled();
  });

  it('renvoie false quand le micro est refusé', async () => {
    getUserMedia.mockRejectedValue(new Error('denied'));
    const { result } = renderHook(() => useRecorder());
    expect(await act(() => result.current.start())).toBe(false);
    expect(result.current.recording).toBe(false);
  });

  it('ne rend rien si rien ne tourne', async () => {
    const { result } = renderHook(() => useRecorder());
    expect(await act(() => result.current.stop())).toBeNull();
  });

  it('coupe seul après la durée maximale', async () => {
    const { result } = renderHook(() => useRecorder());
    await act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(MAX_RECORDING_MS);
    });
    expect(FakeRecorder.last.state).toBe('inactive');
    expect(result.current.recording).toBe(false);
  });

  it('libère le micro au démontage', async () => {
    const { result, unmount } = renderHook(() => useRecorder());
    await act(() => result.current.start());
    unmount();
    expect(track.stop).toHaveBeenCalled();
  });

  it('canRecord suit la présence de MediaRecorder', () => {
    expect(canRecord()).toBe(true);
    vi.stubGlobal('MediaRecorder', undefined);
    expect(canRecord()).toBe(false);
  });
});
