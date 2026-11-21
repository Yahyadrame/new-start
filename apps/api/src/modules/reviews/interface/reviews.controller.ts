import { Body, Controller, Get, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { GradeReview, MissedExpressions } from '@newstart/shared';
import { z } from 'zod';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { ReviewsService } from '../application/reviews.js';

const CardId = z.object({ id: z.uuid() });

@Controller('reviews')
@UseGuards(AccessGuard)
export class ReviewsController {
  constructor(@Inject(ReviewsService) private readonly reviews: ReviewsService) {}

  @Get('due')
  due(@CurrentUserId() userId: string) {
    return this.reviews.listDue(userId);
  }

  @Post(':id/grade')
  grade(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: unknown) {
    const { id: cardId } = parseBody(CardId, { id });
    return this.reviews.grade(userId, cardId, parseBody(GradeReview, body).grade);
  }

  /** Les expressions ratées dans un jeu deviennent des cartes à réviser. */
  @Post('missed')
  @HttpCode(200)
  missed(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.reviews.addMissed(userId, parseBody(MissedExpressions, body).expressionIds);
  }
}
