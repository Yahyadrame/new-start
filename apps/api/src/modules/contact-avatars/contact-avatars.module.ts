import { Module } from '@nestjs/common';
import {
  CONTACT_AVATARS_STORE,
  ContactAvatarsService,
  type ContactAvatarsStore,
} from './application/contact-avatars.js';
import { PrismaContactAvatarsStore } from './infrastructure/prisma-contact-avatars.store.js';
import { ContactAvatarsController } from './interface/contact-avatars.controller.js';

@Module({
  controllers: [ContactAvatarsController],
  providers: [
    { provide: CONTACT_AVATARS_STORE, useClass: PrismaContactAvatarsStore },
    {
      provide: ContactAvatarsService,
      inject: [CONTACT_AVATARS_STORE],
      useFactory: (store: ContactAvatarsStore) => new ContactAvatarsService(store),
    },
  ],
})
export class ContactAvatarsModule {}
