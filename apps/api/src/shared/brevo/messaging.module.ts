import { Global, Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import { createMailer, createSmsSender } from './messaging.js';

export const MAILER = Symbol('MAILER');
export const SMS_SENDER = Symbol('SMS_SENDER');

@Global()
@Module({
  providers: [
    { provide: MAILER, inject: [ENV], useFactory: (env: Env) => createMailer(env) },
    { provide: SMS_SENDER, inject: [ENV], useFactory: (env: Env) => createSmsSender(env) },
  ],
  exports: [MAILER, SMS_SENDER],
})
export class MessagingModule {}
