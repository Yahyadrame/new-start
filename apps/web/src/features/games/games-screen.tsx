'use client';

import type { TrueFalseQuestion } from '@newstart/shared';
import { Skeleton } from '@newstart/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { BottomNav } from '../../shared/navigation';
import { trueFalseQuestions } from './games-api';
import { TrueFalseGame } from './true-false-game';

const t = fr.games;

/** Onglet Jeux : pour l'instant, une partie de Vrai ou faux de dix questions. */
export function GamesScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<TrueFalseQuestion[] | null>(null);
  const [round, setRound] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    setQuestions(null);
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      try {
        setQuestions(await trueFalseQuestions(session.accessToken));
      } catch {
        setError(true);
      }
    })();
  }, [router, round]);

  const replay = useCallback(() => setRound((r) => r + 1), []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-6 pt-10 pb-28">
      <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
        {t.title}
      </h1>
      {error && <p role="alert">{t.error}</p>}
      {!error && !questions && <Skeleton className="h-48 w-full" />}
      {questions && questions.length === 0 && <p>{t.empty}</p>}
      {questions && questions.length > 0 && (
        <TrueFalseGame key={round} questions={questions} onReplay={replay} />
      )}
      <BottomNav />
    </main>
  );
}
