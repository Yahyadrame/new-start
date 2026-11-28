'use client';

import { MicOff, Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../lib/cn';

/** Barres égales pour un vocal sans onde : sans elles, wavesurfer téléchargerait le fichier. */
const FLAT = Array<number>(40).fill(0.25);

/** Le bouton et les couleurs de l'onde (`--wave`, puis `--wave-done` pour la partie lue). */
const TONES = {
  theirs: {
    button: 'bg-accent text-on-accent focus-visible:outline-accent-text',
    wave: '[--wave:var(--color-text-muted)] [--wave-done:var(--color-text)]',
    time: 'text-text-muted',
  },
  mine: {
    button: 'bg-on-accent text-accent focus-visible:outline-on-accent',
    wave: '[--wave:color-mix(in_srgb,var(--color-on-accent)_45%,transparent)] [--wave-done:var(--color-on-accent)]',
    time: 'text-on-accent',
  },
};

/** Un seul vocal à la fois : celui qui démarre arrête le précédent. */
let playing: HTMLAudioElement | null = null;

const clock = (seconds: number) => {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

const colors = (element: Element) => {
  const style = getComputedStyle(element);
  return {
    waveColor: style.getPropertyValue('--wave'),
    progressColor: style.getPropertyValue('--wave-done'),
  };
};

export type VoiceNoteProps = {
  /** Lien du fichier, ou null quand il n'y en a plus. */
  src: string | null;
  seconds: number | null;
  /** L'onde en barres de 0 à 100. */
  peaks?: number[] | undefined;
  labels: { play: string; pause: string };
  /** La raison affichée à la place du lecteur quand le vocal ne peut pas être lu. */
  unavailableLabel: string;
  /** `mine` : dans une bulle de couleur accent. */
  tone?: 'theirs' | 'mine';
  className?: string | undefined;
};

/** Un message vocal : lecture, onde et durée. Rien n'est téléchargé avant l'appui sur lecture. */
export function VoiceNote({
  src,
  unavailableLabel,
  className,
  ...props
}: Readonly<VoiceNoteProps>) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || src === failed) {
    return (
      <p className={cn('flex min-h-11 items-center gap-2 text-sm italic', className)}>
        <MicOff aria-hidden="true" className="size-4 shrink-0" />
        {unavailableLabel}
      </p>
    );
  }
  return <Player {...props} src={src} className={className} onFail={setFailed} />;
}

function Player({
  src,
  seconds,
  peaks,
  labels,
  tone = 'theirs',
  className,
  onFail,
}: Omit<VoiceNoteProps, 'src' | 'unavailableLabel'> & {
  src: string;
  onFail: (src: string) => void;
}) {
  // Le lien change à chaque relecture des messages : le lecteur garde le premier tant qu'il répond.
  const [first] = useState(src);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [wave, setWave] = useState<HTMLSpanElement | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  // Une chaîne : l'onde n'est redessinée que si ses valeurs changent.
  const bars = peaks?.join(',');

  useEffect(() => {
    if (!audio || !wave) return;
    let erase: (() => void) | undefined;
    let gone = false;
    // Chargée à part : seules les pages qui affichent un vocal la téléchargent.
    import('wavesurfer.js').then(
      ({ default: WaveSurfer }) => {
        if (gone) return;
        const surfer = WaveSurfer.create({
          container: wave,
          media: audio,
          peaks: [bars ? bars.split(',').map((bar) => Number(bar) / 100) : FLAT],
          duration: seconds || 1,
          height: 24,
          barWidth: 3,
          barGap: 3,
          barRadius: 2,
          barMinHeight: 3,
          cursorWidth: 0,
          // ponytail: pas de déplacement dans l'onde ; l'ajouter avec une commande au clavier.
          interact: false,
          ...colors(wave),
        });
        // Le canvas ne suit pas les variables CSS : on les relit quand le thème change.
        const repaint = () => surfer.setOptions(colors(wave));
        const system = window.matchMedia?.('(prefers-color-scheme: dark)');
        const chosen = new MutationObserver(repaint);
        chosen.observe(document.documentElement, { attributeFilter: ['data-theme'] });
        system?.addEventListener('change', repaint);
        erase = () => {
          chosen.disconnect();
          system?.removeEventListener('change', repaint);
          surfer.destroy();
        };
      },
      // Sans la bibliothèque, il manque l'onde ; la lecture marche quand même.
      () => undefined,
    );
    return () => {
      gone = true;
      erase?.();
      if (playing === audio) playing = null;
    };
  }, [audio, wave, bars, seconds, tone]);

  const start = (element: HTMLAudioElement) => {
    // Un échec de lecture arrive aussi par l'événement `error`, traité plus bas.
    element.play()?.catch(() => undefined);
  };
  const stopped = () => setPlaying(false);
  const look = tone === 'mine' ? TONES.mine : TONES.theirs;

  return (
    <div className={cn('flex w-56 max-w-full items-center gap-2.5', className)}>
      <button
        type="button"
        aria-label={isPlaying ? labels.pause : labels.play}
        onClick={() => audio && (isPlaying ? audio.pause() : start(audio))}
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2',
          look.button,
        )}
      >
        {isPlaying ? (
          <Pause aria-hidden="true" className="size-4 fill-current" />
        ) : (
          <Play aria-hidden="true" className="size-4 fill-current" />
        )}
      </button>
      <span ref={setWave} aria-hidden="true" className={cn('h-6 min-w-0 flex-1', look.wave)} />
      <span className={cn('text-xs tabular-nums', look.time)}>
        {clock(position || (seconds ?? 0))}
      </span>
      <audio
        ref={setAudio}
        src={first}
        preload="none"
        onPlay={(event) => {
          if (playing !== event.currentTarget) playing?.pause();
          playing = event.currentTarget;
          setPlaying(true);
        }}
        onPause={stopped}
        onEnded={() => {
          stopped();
          setPosition(0);
        }}
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
        onError={(event) => {
          stopped();
          const element = event.currentTarget;
          // Lien expiré (une heure) : on reprend avec le plus récent, sinon on le dit.
          if (element.getAttribute('src') === src) return onFail(src);
          element.setAttribute('src', src);
          start(element);
        }}
      />
    </div>
  );
}
