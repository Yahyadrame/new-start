import { Module } from '@nestjs/common';
import { ME_STORE, MeService, type MeStore } from './application/me.js';
import { PrismaMeStore } from './infrastructure/prisma-me.store.js';
import { MeController } from './interface/me.controller.js';

@Module({
  controllers: [MeController],
  providers: [
    { provide: ME_STORE, useClass: PrismaMeStore },
    {
      provide: MeService,
      inject: [ME_STORE],
      useFactory: (store: MeStore) => new MeService(store),
    },
  ],
})
export class MeModule {}
