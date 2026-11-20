import { z } from 'zod';

/** Une carte à réviser, telle que `GET /reviews/due` la renvoie. */
export const DueReviewItem = z.object({
  id: z.string(),
  expressionId: z.number().int(),
  text: z.string(),
  meaningFr: z.string(),
  due: z.string(),
});
export type DueReviewItem = z.infer<typeof DueReviewItem>;

/** Corps de `POST /reviews/:id/grade`. */
export const GradeReview = z.object({ grade: z.enum(['again', 'hard', 'good', 'easy']) });
export type GradeReview = z.infer<typeof GradeReview>;
