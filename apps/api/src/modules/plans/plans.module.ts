import { Module } from '@nestjs/common';
import { PLANS_STORE, PlansService, type PlansStore } from './application/plans.js';
import { PrismaPlansStore } from './infrastructure/prisma-plans.store.js';
import { PlansController } from './interface/plans.controller.js';

@Module({
  controllers: [PlansController],
  providers: [
    { provide: PLANS_STORE, useClass: PrismaPlansStore },
    {
      provide: PlansService,
      inject: [PLANS_STORE],
      useFactory: (store: PlansStore) => new PlansService(store),
    },
  ],
})
export class PlansModule {}
