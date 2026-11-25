'use client';

import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import fr from '../../shared/i18n/fr.json';
import styles from './splash.module.css';
import {
  durationFor,
  FIRST_LAUNCH_KEY,
  OFF_KEY,
  pickTrack,
  SHOWN_KEY,
  TIMELINE,
  type Track,
} from './timeline';

const t = fr.splash;

type Phase = { name: 'pending' } | { name: 'play' | 'leaving'; track: Track } | { name: 'done' };

function alreadyShown(): boolean {
  try {
    return sessionStorage.getItem(SHOWN_KEY) !== null || localStorage.getItem(OFF_KEY) === 'off';
  } catch {
    return false;
  }
}

/**
 * Écran de démarrage : une fois par ouverture de l'appli, au-dessus de tout, puis retiré du DOM.
 * Un toucher, Entrée ou Échap le saute. Le rendu serveur est un simple fond noir, comme l'écran du système.
 */
export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>({ name: 'pending' });

  useEffect(() => {
    if (alreadyShown()) return setPhase({ name: 'done' });
    const track = pickTrack(localStorage);
    try {
      sessionStorage.setItem(SHOWN_KEY, '1');
      localStorage.setItem(FIRST_LAUNCH_KEY, '1');
    } catch {
      // Stockage indisponible : l'animation se joue, sans mémoire.
    }
    setPhase({ name: 'play', track });
  }, []);

  const track = phase.name === 'play' || phase.name === 'leaving' ? phase.track : null;

  useEffect(() => {
    if (!track || phase.name !== 'play') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const end = () => setPhase({ name: 'leaving', track });
    const timer = setTimeout(end, durationFor(track, reduced));
    const onKey = (e: KeyboardEvent) => (e.key === 'Enter' || e.key === 'Escape') && end();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [track, phase.name]);

  useEffect(() => {
    if (phase.name !== 'leaving') return;
    const timer = setTimeout(() => setPhase({ name: 'done' }), TIMELINE.fade);
    return () => clearTimeout(timer);
  }, [phase.name]);

  if (phase.name === 'done') return null;

  const classes = [
    styles['root'],
    track === 'first' ? styles['first'] : '',
    phase.name === 'play' || phase.name === 'leaving' ? styles['play'] : '',
    phase.name === 'leaving' ? styles['leaving'] : '',
  ].join(' ');

  return (
    <div
      role="img"
      aria-label={t.label}
      className={classes}
      data-testid="splash"
      onPointerDown={() =>
        phase.name === 'play' && setPhase({ name: 'leaving', track: phase.track })
      }
    >
      {track && (
        <>
          <div aria-hidden="true" className={styles['lines']}>
            <p className={styles['wrong']}>
              {t.wrongBefore}
              <span className={styles['strike']}>{t.wrongWord}</span>
              {t.wrongAfter}
            </p>
            <p className={styles['right']}>
              {t.right}
              <Check aria-hidden="true" className="size-5" strokeWidth={3} />
            </p>
          </div>
          <div aria-hidden="true" className={styles['stack']}>
            <svg className={styles['icon']} viewBox="0 0 120 120">
              <rect width="120" height="120" rx="29" fill="#CCFF00" />
              <path
                d="M24 22h72a12 12 0 0112 12v42a12 12 0 01-12 12H52l-20 16V88h-8a12 12 0 01-12-12V34a12 12 0 0112-12z"
                fill="#000"
              />
              <path
                className={styles['n']}
                pathLength={100}
                d="M44 72V38l32 34V38"
                fill="none"
                stroke="#CCFF00"
                strokeWidth={10}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={styles['word']}>{t.label}</span>
          </div>
        </>
      )}
    </div>
  );
}
