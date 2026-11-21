'use client';

import type { MatchQuestion, TrueFalseQuestion } from '@newstart/shared';
import { Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@newstart/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { BottomNav } from '../../shared/navigation';
import { matchQuestions, trueFalseQuestions } from './games-api';
import { MatchGame } from './match-game';
import { TrueFalseGame } from './true-false-game';

const t = fr.games;

/** Onglet Jeux : Vrai ou faux (dix questions) ou Associer (trois tableaux). */
export function GamesScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'true-false' | 'match'>('true-false');
  const [questions, setQuestions] = useState<TrueFalseQuestion[] | MatchQuestion[] | null>(null);
  const [round, setRound] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    setQuestions(null);
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      try {
        setQuestions(
          await (mode === 'match' ? matchQuestions : trueFalseQuestions)(session.accessToken),
        );
      } catch {
        setError(true);
      }
    })();
  }, [router, round, mode]);

  const replay = useCallback(() => setRound((r) => r + 1), []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-6 pt-10 pb-28">
      <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
        {t.title}
      </h1>
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setError(false);
          setQuestions(null);
          setMode(v as typeof mode);
        }}
      >
        <TabsList>
          <TabsTrigger value="true-false">{t.modes.trueFalse}</TabsTrigger>
          <TabsTrigger value="match">{t.modes.match}</TabsTrigger>
        </TabsList>
        <TabsContent value={mode} className="flex flex-col gap-5">
          {error && <p role="alert">{t.error}</p>}
          {!error && !questions && <Skeleton className="h-48 w-full" />}
          {questions && questions.length === 0 && <p>{t.empty}</p>}
          {questions && questions.length > 0 && mode === 'true-false' && (
            <TrueFalseGame
              key={round}
              questions={questions as TrueFalseQuestion[]}
              onReplay={replay}
            />
          )}
          {questions && questions.length > 0 && mode === 'match' && (
            <MatchGame key={round} questions={questions as MatchQuestion[]} onReplay={replay} />
          )}
        </TabsContent>
      </Tabs>
      <BottomNav />
    </main>
  );
}
