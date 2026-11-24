'use client';

import type { DueReviewItem, GradeReview } from '@newstart/shared';
import { Button, Skeleton } from '@newstart/ui';
import { useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { fetchDueReviews, gradeReview } from './games-api';

const t = fr.games.review;
const GRADES = ['again', 'hard', 'good', 'easy'] as const satisfies readonly GradeReview['grade'][];

/** Carte « À réviser » : le nombre de cartes dues, puis une séance carte par carte. */
export function ReviewSession() {
  const [cards, setCards] = useState<DueReviewItem[] | null>(null);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [gradeFailed, setGradeFailed] = useState(false);

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return;
      try {
        setCards(await fetchDueReviews(session.accessToken));
      } catch {
        setError(true);
      }
    })();
  }, []);

  if (error) return <p role="alert">{t.error}</p>;
  if (!cards) return <Skeleton className="h-24 w-full" />;

  const grade = async (card: DueReviewItem, value: GradeReview['grade']) => {
    const session = await ensureSession();
    if (!session) return;
    try {
      await gradeReview(session.accessToken, card.id, value);
      setGradeFailed(false);
      setShown(false);
      setIndex((i) => i + 1);
    } catch {
      setGradeFailed(true);
    }
  };
  const close = () => {
    setPlaying(false);
    setCards([]);
    setIndex(0);
  };

  const card = cards[index];
  if (playing && !card) {
    return (
      <section aria-labelledby="review-title" className="flex flex-col gap-3" aria-live="polite">
        <h2 id="review-title" className="font-display text-xl font-bold">
          {t.doneTitle}
        </h2>
        <p>{t.doneText}</p>
        <Button className="min-h-11" onClick={close}>
          {t.close}
        </Button>
      </section>
    );
  }

  if (playing && card) {
    return (
      <section aria-labelledby="review-title" className="flex flex-col gap-4">
        <h2 id="review-title" className="font-display text-xl font-bold">
          {t.title}
        </h2>
        <p className="text-sm text-text-muted">
          {t.progress.replace('{n}', String(index + 1)).replace('{total}', String(cards.length))}
        </p>
        <div className="rounded-2xl border border-line p-5">
          <p className="font-display text-2xl font-bold">{card.text}</p>
          {shown && (
            <>
              <p className="mt-2 text-text-muted">{t.means}</p>
              <p className="text-lg">{card.meaningFr}</p>
            </>
          )}
        </div>
        {gradeFailed && <p role="alert">{t.gradeError}</p>}
        {shown ? (
          <>
            <p className="text-sm text-text-muted">{t.how}</p>
            <div className="grid grid-cols-2 gap-3">
              {GRADES.map((g) => (
                <Button
                  key={g}
                  className="min-h-11"
                  variant="outline"
                  onClick={() => void grade(card, g)}
                >
                  {t[g]}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <Button className="min-h-11" onClick={() => setShown(true)}>
            {t.show}
          </Button>
        )}
      </section>
    );
  }

  const n = cards.length;
  return (
    <section
      aria-labelledby="review-title"
      className="flex flex-col gap-3 rounded-3xl border border-line bg-surface-1 p-4"
    >
      <h2 id="review-title" className="font-display text-xl font-bold">
        {t.title}
      </h2>
      <p className="text-[15px] text-text-muted">
        {n === 0 ? t.none : n === 1 ? t.one : t.count.replace('{n}', String(n))}
      </p>
      {n > 0 && (
        <Button className="min-h-11" onClick={() => setPlaying(true)}>
          {t.start}
        </Button>
      )}
    </section>
  );
}
