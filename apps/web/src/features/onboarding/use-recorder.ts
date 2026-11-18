import { useCallback, useEffect, useRef, useState } from 'react';

/** 1 Mo d'audio compressé couvre environ une minute : on coupe avant la limite de l'API. */
export const MAX_RECORDING_MS = 60_000;

export const canRecord = () =>
  typeof window !== 'undefined' &&
  typeof MediaRecorder !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia;

/** Enregistre le micro. `start` renvoie false si l'accès est refusé ; `stop` rend l'audio. */
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const done = useRef<((blob: Blob) => void) | null>(null);

  const release = useCallback(() => {
    clearTimeout(timer.current);
    recorder.current?.stream.getTracks().forEach((track) => track.stop());
    recorder.current = null;
    setRecording(false);
  }, []);

  useEffect(() => release, [release]);

  const stop = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const current = recorder.current;
        if (!current || current.state === 'inactive') return resolve(null);
        done.current = resolve;
        current.stop();
      }),
    [],
  );

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const next = new MediaRecorder(stream);
      next.ondataavailable = (e) => chunks.push(e.data);
      next.onstop = () => {
        const blob = new Blob(chunks, { type: next.mimeType || 'audio/webm' });
        release();
        done.current?.(blob);
        done.current = null;
      };
      recorder.current = next;
      next.start();
      timer.current = setTimeout(() => next.state !== 'inactive' && next.stop(), MAX_RECORDING_MS);
      setRecording(true);
      return true;
    } catch {
      return false;
    }
  }, [release]);

  return { recording, start, stop };
}
