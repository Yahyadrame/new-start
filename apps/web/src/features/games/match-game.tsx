'use client';

import type { MatchQuestion } from '@newstart/shared';
import { Button } from '@newstart/ui';
import { useState } from 'react';
import fr from '../../shared/i18n/fr.json';

const t = fr.games;

/** Associer : on touche une expression, puis son sens. Un tableau de quatre paires à la fois. */
export function MatchGame({
  questions,
  onReplay,
  onFinish,
}: Readonly<{
  questions: MatchQuestion[];
  onReplay: () => void;
  /** Appelé une fois, au dernier tableau, avec les expressions ratées. */
  onFinish: (missedIds: number[]) => void;
}>) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [solved, setSolved] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);
  const [wrongMeaning, setWrongMeaning] = useState<number | null>(null);

  const board = questions.at(index);
  if (!board) {
    return (
      <section className="flex flex-col gap-4" aria-live="polite">
        <h2 className="font-display text-2xl font-bold">{t.end.title}</h2>
        <p>{t.match.mistakes.replace('{n}', String(mistakes))}</p>
        <Button onClick={onReplay}>{t.end.replay}</Button>
      </section>
    );
  }

  const done = solved.length === board.pairs.length;
  const pickMeaning = (id: number) => {
    if (selected === null) return;
    if (id === selected) {
      setSolved((s) => [...s, id]);
    } else {
      setMistakes((m) => m + 1);
      setMissed((m) => (m.includes(selected) ? m : [...m, selected]));
      setWrongMeaning(id);
    }
    setSelected(null);
  };
  const next = () => {
    if (index + 1 === questions.length) onFinish(missed);
    setSolved([]);
    setWrongMeaning(null);
    setIndex((i) => i + 1);
  };

  return (
    <section className="flex flex-col gap-5">
      <p className="text-sm text-text-muted">
        {t.progress.replace('{n}', String(index + 1)).replace('{total}', String(questions.length))}
      </p>
      <p>{t.match.hint}</p>
      <div className="grid grid-cols-2 gap-3">
        <ul className="flex flex-col gap-3">
          {board.pairs.map((p) => (
            <li key={p.expressionId}>
              <Button
                className="min-h-11 w-full"
                variant={selected === p.expressionId ? 'primary' : 'outline'}
                aria-pressed={selected === p.expressionId}
                disabled={solved.includes(p.expressionId)}
                onClick={() => {
                  setWrongMeaning(null);
                  setSelected(p.expressionId);
                }}
              >
                {p.text}
              </Button>
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-3">
          {board.meanings.map((m) => (
            <li key={m.expressionId}>
              <Button
                className="min-h-11 w-full"
                variant="outline"
                disabled={solved.includes(m.expressionId) || selected === null}
                onClick={() => pickMeaning(m.expressionId)}
              >
                {m.meaningFr}
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <div role="status" className="flex flex-col gap-3">
        {wrongMeaning !== null && <p className="font-semibold">{t.match.wrong}</p>}
        {done && (
          <>
            <p className="font-semibold">{t.match.done}</p>
            <Button onClick={next}>
              {index + 1 === questions.length ? t.finish : t.match.next}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
