import { Module } from '@nestjs/common';
import { createMediaStores } from '../../shared/media/media-store.js';
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
      // Les variables MEDIA_* sont vérifiées par `createMediaStores`.
      useFactory: (store: MeStore) => new MeService(store, createMediaStores(process.env)),
    },
  ],
})
export class MeModule {}
