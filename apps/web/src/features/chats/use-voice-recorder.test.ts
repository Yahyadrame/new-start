import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDuration, MAX_VOICE_SECONDS, useVoiceRecorder } from './use-voice-recorder';

class FakeRecorder {
  static last: FakeRecorder;
  mimeType = 'audio/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  stream = { getTracks: () => [{ stop: trackStop }] };
  constructor() {
    FakeRecorder.last = this;
  }
  start() {}
  stop() {
    this.ondataavailable?.({ data: new Blob(['x']) });
    this.onstop?.();
  }
}
const trackStop = vi.fn();
const getUserMedia = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  getUserMedia.mockResolvedValue({});
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  URL.createObjectURL = vi.fn(() => 'blob:clip');
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const begin = async (onClip = vi.fn()) => {
  const hook = renderHook(() => useVoiceRecorder(onClip));
  await act(async () => void (await hook.result.current.start()));
  return { hook, onClip };
};

describe('useVoiceRecorder', () => {
  it('compte les secondes puis rend le clip à l’arrêt', async () => {
    const { hook, onClip } = await begin();
    expect(hook.result.current.recording).toBe(true);
    act(() => void vi.advanceTimersByTime(3000));
    expect(hook.result.current.seconds).toBe(3);
    act(() => hook.result.current.stop());
    expect(onClip).toHaveBeenCalledWith(expect.objectContaining({ url: 'blob:clip' }));
    expect(hook.result.current.recording).toBe(false);
    expect(trackStop).toHaveBeenCalled();
  });

  it('ne garde rien quand on annule, et coupe le micro', async () => {
    const { hook, onClip } = await begin();
    act(() => hook.result.current.cancel());
    expect(onClip).not.toHaveBeenCalled();
    expect(hook.result.current.recording).toBe(false);
    expect(trackStop).toHaveBeenCalled();
  });

  it('s’arrête tout seul à 2 minutes', async () => {
    const { hook, onClip } = await begin();
    act(() => void vi.advanceTimersByTime(MAX_VOICE_SECONDS * 1000));
    expect(onClip).toHaveBeenCalledTimes(1);
    expect(hook.result.current.recording).toBe(false);
  });

  it('referme le micro si l’écran s’est fermé pendant la demande du navigateur', async () => {
    let allow!: (stream: unknown) => void;
    getUserMedia.mockReturnValue(new Promise((resolve) => (allow = resolve)));
    const hook = renderHook(() => useVoiceRecorder(vi.fn()));
    const starting = hook.result.current.start();
    hook.unmount();
    await act(async () => {
      allow({ getTracks: () => [{ stop: trackStop }] });
      await starting;
    });
    expect(trackStop).toHaveBeenCalled();
  });

  it('démarre encore après un double montage (mode strict de React)', async () => {
    const hook = renderHook(() => useVoiceRecorder(vi.fn()), { wrapper: StrictMode });
    await act(async () => void (await hook.result.current.start()));
    expect(hook.result.current.recording).toBe(true);
  });

  it('signale un micro refusé', async () => {
    getUserMedia.mockRejectedValue(new Error('denied'));
    const { hook } = await begin();
    expect(hook.result.current.error).toBe('denied');
    expect(hook.result.current.recording).toBe(false);
  });

  it('signale un navigateur sans enregistrement', async () => {
    vi.stubGlobal('MediaRecorder', undefined);
    const { hook } = await begin();
    expect(hook.result.current.error).toBe('unavailable');
  });

  it('coupe le micro sans rien garder si l’écran se ferme', async () => {
    const { hook, onClip } = await begin();
    hook.unmount();
    expect(onClip).not.toHaveBeenCalled();
    expect(trackStop).toHaveBeenCalled();
  });
});

describe('formatDuration', () => {
  it('écrit minutes et secondes', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
  });
});
