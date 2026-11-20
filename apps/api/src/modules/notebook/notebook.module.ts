import { Module } from '@nestjs/common';
import { NOTEBOOK_STORE, NotebookService, type NotebookStore } from './application/notebook.js';
import { PrismaNotebookStore } from './infrastructure/prisma-notebook.store.js';
import { NotebookController } from './interface/notebook.controller.js';

@Module({
  controllers: [NotebookController],
  providers: [
    { provide: NOTEBOOK_STORE, useClass: PrismaNotebookStore },
    {
      provide: NotebookService,
      inject: [NOTEBOOK_STORE],
      useFactory: (store: NotebookStore) => new NotebookService(store),
    },
  ],
})
export class NotebookModule {}
