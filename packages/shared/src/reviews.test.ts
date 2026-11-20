import { describe, expect, it } from 'vitest';
import { DueReviewItem, GradeReview } from './reviews';

describe('GradeReview', () => {
  it.each(['again', 'hard', 'good', 'easy'])('accepte « %s »', (grade) =>
    expect(GradeReview.safeParse({ grade }).success).toBe(true),
  );

  it.each([{}, { grade: 'perfect' }, { grade: 3 }, { grade: 'GOOD' }])('refuse %j', (body) =>
    expect(GradeReview.safeParse(body).success).toBe(false),
  );
});

describe('DueReviewItem', () => {
  it('décrit une carte à réviser', () => {
    const card = {
      id: 'c1',
      expressionId: 7,
      text: 'Break a leg',
      meaningFr: 'Bonne chance',
      due: '2026-11-20T12:00:00.000Z',
    };
    expect(DueReviewItem.parse(card)).toEqual(card);
    expect(DueReviewItem.safeParse({ ...card, expressionId: 1.5 }).success).toBe(false);
  });
});
