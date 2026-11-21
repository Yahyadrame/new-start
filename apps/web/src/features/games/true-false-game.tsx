'use client';

import type { TrueFalseQuestion } from '@newstart/shared';
import { Button } from '@newstart/ui';
import { useState } from 'react';
import fr from '../../shared/i18n/fr.json';
import type { GameOutcome } from './games-api';

const t = fr.games;

/** Une partie de Vrai ou faux : une question à la fois, correction immédiate, score à la fin. */
export function TrueFalseGame({
  questions,
  onReplay,
  onFinish,
  xp,
  replayLabel = t.end.replay,
}: Readonly<{
  questions: TrueFalseQuestion[];
  onReplay: () => void;
  /** Appelé une fois, à la dernière question. */
  onFinish: (outcome: GameOutcome) => void;
  /** L'XP gagné, une fois connu. */
  xp: number | null;
  /** Texte du bouton de fin (« Rejouer » par défaut). */
  replayLabel?: string;
}>) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);

  const question = questions.at(index);
  if (!question) {
    return (
      <section className="flex flex-col gap-4" aria-live="polite">
        <h2 className="font-display text-2xl font-bold">{t.end.title}</h2>
        <p>
          {t.end.score
            .replace('{score}', String(score))
            .replace('{total}', String(questions.length))}
        </p>
        {xp !== null && <p>{t.end.xp.replace('{n}', String(xp))}</p>}
        <Button onClick={onReplay}>{replayLabel}</Button>
      </section>
    );
  }

  const answered = picked !== null;
  const correct = picked === question.answer;
  const choose = (value: boolean) => {
    if (answered) return;
    setPicked(value);
    if (value === question.answer) setScore((s) => s + 1);
    else setMissed((m) => [...m, question.expressionId]);
  };
  const next = () => {
    if (index + 1 === questions.length) onFinish({ correct: score, missedIds: missed });
    setPicked(null);
    setIndex((i) => i + 1);
  };

  return (
    <section className="flex flex-col gap-5">
      <p className="text-sm text-text-muted">
        {t.progress.replace('{n}', String(index + 1)).replace('{total}', String(questions.length))}
      </p>
      <div className="rounded-2xl border border-line p-5">
        <p className="font-display text-2xl font-bold">{question.text}</p>
        <p className="mt-2 text-text-muted">{t.trueFalse.means}</p>
        <p className="text-lg">{question.meaningFr}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="min-h-11"
          variant="outline"
          disabled={answered}
          onClick={() => choose(true)}
        >
          {t.trueFalse.true}
        </Button>
        <Button
          className="min-h-11"
          variant="outline"
          disabled={answered}
          onClick={() => choose(false)}
        >
          {t.trueFalse.false}
        </Button>
      </div>
      {answered && (
        <div className="flex flex-col gap-3" role="status">
          <p className="font-semibold">{correct ? t.right : t.wrong}</p>
          <Button onClick={next}>{index + 1 === questions.length ? t.finish : t.next}</Button>
        </div>
      )}
    </section>
  );
}
