import { Module } from '@nestjs/common';
import { CATALOG_STORE, CatalogService, type CatalogStore } from './application/catalog.js';
import { PrismaCatalogStore } from './infrastructure/prisma-catalog.store.js';
import { CatalogController } from './interface/catalog.controller.js';

@Module({
  controllers: [CatalogController],
  providers: [
    { provide: CATALOG_STORE, useClass: PrismaCatalogStore },
    {
      provide: CatalogService,
      inject: [CATALOG_STORE],
      useFactory: (store: CatalogStore) => new CatalogService(store),
    },
  ],
})
export class CatalogModule {}
