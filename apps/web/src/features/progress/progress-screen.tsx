'use client';

import type { ProgressSummary } from '@newstart/shared';
import { Skeleton } from '@newstart/ui';
import { Flame, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { BottomNav, NotificationsBell } from '../../shared/navigation';
import { fetchProgress } from './progress-api';
import { WeekActivity } from './week-activity';

const t = fr.progress;
const CARD = 'flex flex-col gap-2 rounded-3xl border border-line bg-surface-1 p-4';
const LABEL = 'text-xs font-semibold tracking-[0.08em] text-text-muted uppercase';

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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3 px-4 pt-12 pb-28 lg:max-w-2xl lg:pb-10">
      <header className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-[-0.02em]">
          {t.title}
        </h1>
        <NotificationsBell />
      </header>
      {error && <p role="alert">{t.error}</p>}
      {!error && !summary && <Skeleton className="h-40 w-full rounded-3xl" />}
      {summary && (
        <>
          <section className={CARD}>
            <p className={LABEL}>{t.level}</p>
            <p className="font-display text-[40px] leading-none font-bold">{summary.level}</p>
            <div
              role="progressbar"
              aria-label={t.barLabel}
              aria-valuemin={0}
              aria-valuemax={summary.nextLevelXp}
              aria-valuenow={summary.levelXp}
              className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
            >
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${(summary.levelXp / summary.nextLevelXp) * 100}%` }}
              />
            </div>
            <p className="text-[13px] text-text-muted">
              {t.toNext
                .replace('{n}', String(summary.nextLevelXp - summary.levelXp))
                .replace('{level}', String(summary.level + 1))}
            </p>
          </section>
          <div className="grid grid-cols-2 gap-3">
            <section className={CARD}>
              <p className={LABEL}>{t.streakLabel}</p>
              <p className="flex items-center gap-2 font-display text-2xl font-bold">
                <Flame aria-hidden="true" className="size-5" />
                {(summary.streakDays > 1 ? t.streakValue : t.streakValueOne).replace(
                  '{n}',
                  String(summary.streakDays),
                )}
              </p>
              {summary.streakDays === 0 && (
                <p className="text-[13px] text-text-muted">{t.noStreak}</p>
              )}
            </section>
            <section className={CARD}>
              <p className={LABEL}>{t.totalLabel}</p>
              <p className="flex items-center gap-2 font-display text-2xl font-bold">
                <Zap aria-hidden="true" className="size-5" />
                {summary.xp}
              </p>
            </section>
          </div>
          <WeekActivity summary={summary} />
        </>
      )}
      <BottomNav />
    </main>
  );
}
