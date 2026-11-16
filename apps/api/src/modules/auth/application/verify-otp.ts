import { timingSafeEqual } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { HttpException } from '@nestjs/common';
import { hashCode, OTP_MAX_ATTEMPTS, type OtpChannel } from '../domain/otp.js';
import type { SignupProfile } from '@newstart/shared';
import {
  ACCESS_TTL_SECONDS,
  hashRefreshToken,
  newRefreshToken,
  REFRESH_TTL_MS,
  type AccessSigner,
} from '../domain/tokens.js';

export const ACCOUNT_STORE = Symbol('ACCOUNT_STORE');
export const ACCESS_SIGNER = Symbol('ACCESS_SIGNER');

export type ActiveCode = {
  id: string;
  codeHash: string;
  attempts: number;
  signup: SignupProfile | null;
};
export type UserSummary = { id: string; firstName: string; goal: string; level: string };

/** Port de stockage pour la vérification : codes, comptes et jetons de rafraîchissement. */
export interface AccountStore {
  findActiveCode(destination: string, now: Date): Promise<ActiveCode | null>;
  addAttempt(id: string): Promise<void>;
  /** Marque le code utilisé ; faux si un autre appel l'a déjà pris. */
  consumeCode(id: string): Promise<boolean>;
  findUser(provider: string, subject: string): Promise<UserSummary | null>;
  /** Crée le compte et son identité ; `null` si le numéro ou l'e-mail est déjà pris. */
  createUser(
    profile: SignupProfile,
    channel: OtpChannel,
    destination: string,
  ): Promise<UserSummary | null>;
  saveRefreshToken(row: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<void>;
}

export type Session = {
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
  user: UserSummary;
};

const fail = (status: number, code: string, message: string) =>
  new HttpException({ code, message }, status);
const same = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export class VerifyOtp {
  constructor(
    private readonly store: AccountStore,
    private readonly signer: AccessSigner,
    private readonly key: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: {
    channel: OtpChannel;
    destination: string;
    code: string;
  }): Promise<Session> {
    const { channel, destination, code } = input;
    const now = this.now();
    const active = await this.store.findActiveCode(destination, now);
    // Même erreur pour code absent, expiré, verrouillé ou faux : rien à apprendre pour un attaquant.
    const invalid = fail(400, 'INVALID_CODE', "Ce code n'est pas valable. Demande-en un nouveau.");
    if (!active || active.attempts >= OTP_MAX_ATTEMPTS) throw invalid;
    if (!same(active.codeHash, hashCode(this.key, destination, code))) {
      await this.store.addAttempt(active.id);
      throw invalid;
    }
    if (!(await this.store.consumeCode(active.id))) throw invalid;

    const provider = channel === 'email' ? 'email' : 'phone';
    let user = await this.store.findUser(provider, destination);
    if (!user) {
      if (!active.signup)
        throw fail(404, 'ACCOUNT_NOT_FOUND', "Aucun compte avec ces coordonnées. Crée-le d'abord.");
      user = await this.store.createUser(active.signup, channel, destination);
      if (!user)
        throw fail(409, 'ACCOUNT_CONFLICT', 'Ce numéro ou cette adresse est déjà utilisé.');
    }
    const refreshToken = newRefreshToken();
    await this.store.saveRefreshToken({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      familyId: randomUUID(),
      expiresAt: new Date(now.getTime() + REFRESH_TTL_MS),
    });
    return {
      accessToken: await this.signer.sign(user.id),
      expiresInSeconds: ACCESS_TTL_SECONDS,
      refreshToken,
      user,
    };
  }
}
