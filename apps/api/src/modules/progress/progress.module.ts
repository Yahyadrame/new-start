import { Module } from '@nestjs/common';
import { PROGRESS_STORE, ProgressService, type ProgressStore } from './application/progress.js';
import { PrismaProgressStore } from './infrastructure/prisma-progress.store.js';
import { ProgressController } from './interface/progress.controller.js';

@Module({
  controllers: [ProgressController],
  providers: [
    { provide: PROGRESS_STORE, useClass: PrismaProgressStore },
    {
      provide: ProgressService,
      inject: [PROGRESS_STORE],
      useFactory: (store: ProgressStore) => new ProgressService(store),
    },
  ],
})
export class ProgressModule {}
