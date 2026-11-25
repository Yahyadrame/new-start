import { useCallback, useEffect, useRef, useState } from 'react';

export const MAX_VOICE_SECONDS = 120;

export type VoiceClip = { blob: Blob; url: string; seconds: number };
export type RecorderError = 'denied' | 'unavailable' | null;

/** Enregistre un message vocal avec le micro : durée en direct, arrêt auto à 2 minutes, annulation. */
export function useVoiceRecorder(onClip: (clip: VoiceClip) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<RecorderError>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const keep = useRef(true);
  const startedAt = useRef(0);

  const release = useCallback(() => {
    recorder.current?.stream.getTracks().forEach((track) => track.stop());
    recorder.current = null;
    setRecording(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      return setError('unavailable');
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return setError('denied');
    }
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      const wanted = keep.current;
      const length = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
      release();
      if (!wanted || chunks.length === 0) return;
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      onClip({ blob, url: URL.createObjectURL(blob), seconds: length });
    };
    keep.current = true;
    startedAt.current = Date.now();
    recorder.current = rec;
    rec.start();
    setSeconds(0);
    setRecording(true);
  }, [onClip, release]);

  const stop = useCallback(() => {
    keep.current = true;
    recorder.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    keep.current = false;
    recorder.current?.stop();
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (recording && seconds >= MAX_VOICE_SECONDS) stop();
  }, [recording, seconds, stop]);

  // Si l'écran se ferme en cours d'enregistrement, on coupe le micro sans rien garder.
  useEffect(
    () => () => {
      keep.current = false;
      recorder.current?.stop();
    },
    [],
  );

  return { recording, seconds, error, start, stop, cancel };
}

export function formatDuration(total: number): string {
  const m = Math.floor(total / 60);
  return `${m}:${String(total % 60).padStart(2, '0')}`;
}
