import { randomBytes } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import { MAILER, SMS_SENDER } from '../../shared/brevo/messaging.module.js';
import type { Mailer } from '../../shared/mailer/mailer.js';
import type { SmsSender } from '../../shared/sms/sms.js';
import {
  OTP_KEY,
  OTP_STORE,
  RequestOtp,
  SMS_ENABLED,
  type OtpStore,
} from './application/request-otp.js';
import { PrismaOtpStore } from './infrastructure/prisma-otp.store.js';
import { AuthController } from './interface/auth.controller.js';

@Module({
  controllers: [AuthController],
  providers: [
    { provide: OTP_STORE, useClass: PrismaOtpStore },
    // ponytail: sans OTP_SECRET, clé tirée au démarrage (les codes en attente tombent au redémarrage,
    // et plusieurs instances ne se comprennent pas). Poser OTP_SECRET avant de passer à plusieurs réplicas.
    {
      provide: OTP_KEY,
      inject: [ENV],
      useFactory: (e: Env) => e.OTP_SECRET ?? randomBytes(32).toString('hex'),
    },
    { provide: SMS_ENABLED, inject: [ENV], useFactory: (e: Env) => e.SMS_ENABLED },
    {
      provide: RequestOtp,
      inject: [OTP_STORE, MAILER, SMS_SENDER, OTP_KEY, SMS_ENABLED],
      useFactory: (store: OtpStore, mailer: Mailer, sms: SmsSender, key: string, smsOn: boolean) =>
        new RequestOtp(store, mailer, sms, key, smsOn),
    },
  ],
})
export class AuthModule {}
