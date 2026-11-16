import { HttpException } from '@nestjs/common';
import type { Mailer } from '../../../shared/mailer/mailer.js';
import type { SmsSender } from '../../../shared/sms/sms.js';
import {
  generateCode,
  hashCode,
  OTP_RATE_LIMIT,
  OTP_RATE_WINDOW_MS,
  OTP_TTL_MS,
  type OtpChannel,
} from '../domain/otp.js';
import type { SignupProfile } from '@newstart/shared';

export const OTP_STORE = Symbol('OTP_STORE');
export const OTP_KEY = Symbol('OTP_KEY');
export const SMS_ENABLED = Symbol('SMS_ENABLED');

/** Port de stockage des codes. */
export interface OtpStore {
  countSince(destination: string, since: Date): Promise<number>;
  create(row: {
    channel: OtpChannel;
    destination: string;
    codeHash: string;
    expiresAt: Date;
    signup: SignupProfile | null;
  }): Promise<{ id: string }>;
  remove(id: string): Promise<void>;
}

export type RequestOtpInput = {
  channel: OtpChannel;
  destination: string;
  signup?: SignupProfile | undefined;
};

const fail = (status: number, code: string, message: string) =>
  new HttpException({ code, message }, status);

export class RequestOtp {
  constructor(
    private readonly store: OtpStore,
    private readonly mailer: Mailer,
    private readonly sms: SmsSender,
    private readonly key: string,
    private readonly smsEnabled: boolean,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Même réponse que le compte existe ou non : on ne révèle rien sur les comptes. */
  async execute({
    channel,
    destination,
    signup,
  }: RequestOtpInput): Promise<{ expiresInSeconds: number }> {
    if (channel === 'sms' && !this.smsEnabled) {
      throw fail(400, 'CHANNEL_UNAVAILABLE', "L'envoi par SMS n'est pas encore disponible.");
    }
    const now = this.now();
    const recent = await this.store.countSince(
      destination,
      new Date(now.getTime() - OTP_RATE_WINDOW_MS),
    );
    if (recent >= OTP_RATE_LIMIT) {
      throw fail(429, 'RATE_LIMITED', 'Trop de demandes. Réessaie dans quelques minutes.');
    }
    const code = generateCode();
    const { id } = await this.store.create({
      channel,
      destination,
      codeHash: hashCode(this.key, destination, code),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      signup: signup ?? null,
    });
    try {
      await this.deliver(channel, destination, code);
    } catch {
      await this.store.remove(id);
      throw fail(503, 'DELIVERY_FAILED', "Le code n'a pas pu partir. Réessaie dans un instant.");
    }
    return { expiresInSeconds: OTP_TTL_MS / 1000 };
  }

  private async deliver(channel: OtpChannel, to: string, code: string): Promise<void> {
    if (channel === 'email') {
      await this.mailer.send({
        to,
        subject: 'Ton code New Start',
        text: `Ton code : ${code}\nIl est valable 5 minutes. Si tu n'as rien demandé, ignore ce message.`,
      });
    } else {
      await this.sms.send({ to, text: `New Start : ton code est ${code} (valable 5 min).` });
    }
  }
}
