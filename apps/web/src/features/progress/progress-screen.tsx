'use client';

import type { ProgressSummary } from '@newstart/shared';
import { Skeleton } from '@newstart/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { BottomNav } from '../../shared/navigation';
import { fetchProgress } from './progress-api';
import { WeekActivity } from './week-activity';

const t = fr.progress;

/** Onglet Progrès : niveau, XP total et avancement vers le niveau suivant. */
export function ProgressScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      try {
        setSummary(await fetchProgress(session.accessToken));
      } catch {
        setError(true);
      }
    })();
  }, [router]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-6 pt-10 pb-28">
      <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
        {t.title}
      </h1>
      {error && <p role="alert">{t.error}</p>}
      {!error && !summary && <Skeleton className="h-40 w-full" />}
      {summary && (
        <section className="flex flex-col gap-3 rounded-2xl bg-surface-1 p-5">
          <p className="text-sm text-text-muted">{t.level}</p>
          <p className="font-display text-5xl font-bold">{summary.level}</p>
          <div
            role="progressbar"
            aria-label={t.barLabel}
            aria-valuemin={0}
            aria-valuemax={summary.nextLevelXp}
            aria-valuenow={summary.levelXp}
            className="h-2 w-full overflow-hidden rounded-full bg-line"
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(summary.levelXp / summary.nextLevelXp) * 100}%` }}
            />
          </div>
          <p className="text-sm text-text-muted">
            {t.toNext
              .replace('{n}', String(summary.nextLevelXp - summary.levelXp))
              .replace('{level}', String(summary.level + 1))}
          </p>
          <p>{t.total.replace('{xp}', String(summary.xp))}</p>
          <p>
            {summary.streakDays > 0
              ? t.streak.replace('{n}', String(summary.streakDays))
              : t.noStreak}
          </p>
        </section>
      )}
      {summary && <WeekActivity summary={summary} />}
      <BottomNav />
    </main>
  );
}
