'use client';

import type { TrueFalseQuestion } from '@newstart/shared';
import { Button } from '@newstart/ui';
import { useEffect, useRef, useState } from 'react';
import fr from '../../shared/i18n/fr.json';
import type { GameOutcome } from './games-api';
import { multiplier, pointsFor, readRecord, saveRecord, TIME_ATTACK_SECONDS } from './time-attack';

const t = fr.games;

/** Contre-la-montre : Vrai ou faux enchaîné pendant 60 s, avec combo. */
export function TimeAttackGame({
  questions,
  onReplay,
  onFinish,
  xp,
}: Readonly<{
  questions: TrueFalseQuestion[];
  onReplay: () => void;
  /** Appelé une fois, à la fin. */
  onFinish: (outcome: GameOutcome) => void;
  /** L'XP gagné, une fois connu. */
  xp: number | null;
}>) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);
  const [left, setLeft] = useState(TIME_ATTACK_SECONDS);
  const [record, setRecord] = useState(0);
  const reported = useRef(false);

  const question = questions.at(index);
  const over = left <= 0 || !question;

  useEffect(() => {
    setRecord(readRecord());
  }, []);

  useEffect(() => {
    if (over) return;
    const timer = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [over]);

  useEffect(() => {
    if (!over || reported.current) return;
    reported.current = true;
    saveRecord(score);
    onFinish({ correct, missedIds: missed });
  }, [over, score, correct, missed, onFinish]);

  if (over) {
    return (
      <section className="flex flex-col gap-4" aria-live="polite">
        <h2 className="font-display text-2xl font-bold">{t.end.title}</h2>
        <p>{t.timeAttack.score.replace('{score}', String(score))}</p>
        <p>{t.timeAttack.record.replace('{record}', String(Math.max(record, score)))}</p>
        {xp !== null && <p>{t.end.xp.replace('{n}', String(xp))}</p>}
        <Button onClick={onReplay}>{t.end.replay}</Button>
      </section>
    );
  }

  const choose = (value: boolean) => {
    if (value === question.answer) {
      setScore((s) => s + pointsFor(streak));
      setStreak((n) => n + 1);
      setCorrect((n) => n + 1);
    } else {
      setStreak(0);
      setMissed((m) => [...m, question.expressionId]);
    }
    setIndex((i) => i + 1);
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between text-sm text-text-muted">
        <p>{t.timeAttack.timer.replace('{s}', String(left))}</p>
        <p>{t.timeAttack.score.replace('{score}', String(score))}</p>
        <p>{t.timeAttack.combo.replace('{n}', String(multiplier(streak)))}</p>
      </div>
      <div className="rounded-2xl border border-line p-5">
        <p className="font-display text-2xl font-bold">{question.text}</p>
        <p className="mt-2 text-text-muted">{t.trueFalse.means}</p>
        <p className="text-lg">{question.meaningFr}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button className="min-h-11" variant="outline" onClick={() => choose(true)}>
          {t.trueFalse.true}
        </Button>
        <Button className="min-h-11" variant="outline" onClick={() => choose(false)}>
          {t.trueFalse.false}
        </Button>
      </div>
    </section>
  );
}
