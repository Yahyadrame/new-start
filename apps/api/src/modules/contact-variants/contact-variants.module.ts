import { Module } from '@nestjs/common';
import {
  CONTACT_VARIANTS_STORE,
  ContactVariantsService,
  type ContactVariantsStore,
} from './application/contact-variants.js';
import { PrismaContactVariantsStore } from './infrastructure/prisma-contact-variants.store.js';
import { ContactVariantsController } from './interface/contact-variants.controller.js';

@Module({
  controllers: [ContactVariantsController],
  providers: [
    { provide: CONTACT_VARIANTS_STORE, useClass: PrismaContactVariantsStore },
    {
      provide: ContactVariantsService,
      inject: [CONTACT_VARIANTS_STORE],
      useFactory: (store: ContactVariantsStore) => new ContactVariantsService(store),
    },
  ],
})
export class ContactVariantsModule {}
