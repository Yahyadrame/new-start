'use client';

import { Badge, Button, Skeleton } from '@newstart/ui';
import { useCallback, useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import {
  type DailyChallenge as Daily,
  type GameOutcome,
  fetchDaily,
  sendDailyResult,
  sendMissed,
} from './games-api';
import { TrueFalseGame } from './true-false-game';

const t = fr.games.daily;

/** Carte du défi du jour ; « Jouer » ouvre les dix questions à la place de la carte. */
export function DailyChallenge() {
  const [daily, setDaily] = useState<Daily | null>(null);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<{ gained: number; bonus: number } | null>(null);

  const load = useCallback(async () => {
    const session = await ensureSession();
    if (!session) return;
    try {
      setDaily(await fetchDaily(session.accessToken));
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  // XP et cartes de révision sont un bonus : si l'envoi échoue, le défi n'en souffre pas.
  const finish = useCallback(async ({ correct, missedIds }: GameOutcome) => {
    const session = await ensureSession();
    if (!session) return;
    await sendMissed(session.accessToken, missedIds).catch(() => undefined);
    setResult(await sendDailyResult(session.accessToken, correct).catch(() => null));
  }, []);
  const close = () => {
    setPlaying(false);
    setResult(null);
    setDaily((d) => (d ? { ...d, done: true } : d));
  };

  if (error) return <p role="alert">{t.error}</p>;
  if (!daily) return <Skeleton className="h-32 w-full" />;
  if (daily.questions.length === 0) return null;

  if (playing) {
    return (
      <section aria-labelledby="daily-title" className="flex flex-col gap-4">
        <h2 id="daily-title" className="font-display text-xl font-bold">
          {t.title}
        </h2>
        <TrueFalseGame
          questions={daily.questions}
          onReplay={close}
          onFinish={finish}
          xp={result?.gained ?? null}
          replayLabel={t.close}
        />
        {result && result.bonus > 0 && <p>{t.bonus.replace('{n}', String(result.bonus))}</p>}
      </section>
    );
  }

  return (
    <section
      aria-labelledby="daily-title"
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-1 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="daily-title" className="font-display text-xl font-bold">
          {t.title}
        </h2>
        {daily.done && <Badge variant="neutral">{t.done}</Badge>}
      </div>
      <p className="text-[15px] text-text-muted">{daily.done ? t.doneHint : t.intro}</p>
      <Button className="min-h-11" onClick={() => setPlaying(true)}>
        {daily.done ? t.replay : t.play}
      </Button>
    </section>
  );
}
