'use client';

import type { MatchQuestion, TrueFalseQuestion } from '@newstart/shared';
import { Badge, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@newstart/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { BottomNav } from '../../shared/navigation';
import {
  type GameOutcome,
  fetchStreak,
  matchQuestions,
  sendMissed,
  sendResult,
  trueFalseQuestions,
} from './games-api';
import { MatchGame } from './match-game';
import { TimeAttackGame } from './time-attack-game';
import { TrueFalseGame } from './true-false-game';

const t = fr.games;

/** Onglet Jeux : Vrai ou faux (dix questions) ou Associer (trois tableaux). */
export function GamesScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'true-false' | 'match' | 'time-attack'>('true-false');
  const [questions, setQuestions] = useState<TrueFalseQuestion[] | MatchQuestion[] | null>(null);
  const [round, setRound] = useState(0);
  const [xp, setXp] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);

  // La série est un plus : sans elle, l'écran ne montre simplement pas la ligne.
  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (session) setStreak(await fetchStreak(session.accessToken).catch(() => null));
    })();
  }, [round]);

  useEffect(() => {
    setQuestions(null);
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      try {
        setQuestions(
          await (mode === 'match' ? matchQuestions : trueFalseQuestions)(
            session.accessToken,
            mode === 'time-attack' ? 20 : undefined,
          ),
        );
      } catch {
        setError(true);
      }
    })();
  }, [router, round, mode]);

  const replay = useCallback(() => {
    setXp(null);
    setRound((r) => r + 1);
  }, []);
  // XP et cartes de révision sont un bonus : si l'envoi échoue, la partie n'en souffre pas.
  const finish = useCallback(async ({ correct, missedIds }: GameOutcome) => {
    const session = await ensureSession();
    if (!session) return;
    await sendMissed(session.accessToken, missedIds).catch(() => undefined);
    setXp(await sendResult(session.accessToken, correct).catch(() => null));
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-6 pt-14 pb-28">
      <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
        {t.title}
      </h1>
      {streak !== null && (
        <p className="-mt-3 text-[15px] text-text-muted">
          {streak > 0 ? t.streak.replace('{n}', String(streak)) : t.noStreak}
        </p>
      )}
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setError(false);
          setQuestions(null);
          setXp(null);
          setMode(v as typeof mode);
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="true-false" className="flex-1 px-2">
            {t.modes.trueFalse}
          </TabsTrigger>
          <TabsTrigger value="match" className="flex-1 px-2">
            {t.modes.match}
          </TabsTrigger>
          <TabsTrigger value="time-attack" className="flex-1 px-2">
            {t.modes.timeAttack}
          </TabsTrigger>
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
              onFinish={finish}
              xp={xp}
            />
          )}
          {questions && questions.length > 0 && mode === 'time-attack' && (
            <TimeAttackGame
              key={round}
              questions={questions as TrueFalseQuestion[]}
              onReplay={replay}
              onFinish={finish}
              xp={xp}
            />
          )}
          {questions && questions.length > 0 && mode === 'match' && (
            <MatchGame
              key={round}
              questions={questions as MatchQuestion[]}
              onReplay={replay}
              onFinish={finish}
              xp={xp}
            />
          )}
        </TabsContent>
      </Tabs>
      <section aria-labelledby="upcoming-title" className="flex flex-col gap-3">
        <h2 id="upcoming-title" className="font-display text-xl font-bold">
          {t.upcoming.title}
        </h2>
        <ul className="grid grid-cols-2 gap-3">
          {t.upcoming.items.map((game) => (
            <li
              key={game.name}
              className="flex flex-col gap-1 rounded-2xl border border-line bg-surface-1 p-3"
            >
              <Badge variant="neutral" className="self-start">
                {t.upcoming.badge}
              </Badge>
              <p className="text-[15px] font-semibold">{game.name}</p>
              <p className="text-[13px] text-text-muted">{game.hint}</p>
            </li>
          ))}
        </ul>
      </section>
      <BottomNav />
    </main>
  );
}
