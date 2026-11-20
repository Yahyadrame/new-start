import { Module } from '@nestjs/common';
import { REVIEWS_STORE, ReviewsService, type ReviewsStore } from './application/reviews.js';
import { PrismaReviewsStore } from './infrastructure/prisma-reviews.store.js';
import { ReviewsController } from './interface/reviews.controller.js';

@Module({
  controllers: [ReviewsController],
  providers: [
    { provide: REVIEWS_STORE, useClass: PrismaReviewsStore },
    {
      provide: ReviewsService,
      inject: [REVIEWS_STORE],
      useFactory: (store: ReviewsStore) => new ReviewsService(store),
    },
  ],
})
export class ReviewsModule {}
