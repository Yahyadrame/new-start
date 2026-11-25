import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { AccountStore } from '../application/verify-otp.js';
import type { SignupProfile } from '@newstart/shared';

const summary = { id: true, firstName: true, goal: true, level: true } as const;

@Injectable()
export class PrismaAccountStore implements AccountStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async findActiveCode(destination: string, now: Date) {
    const row = await this.db.otpCode.findFirst({
      where: { destination, consumedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    return (
      row && {
        id: row.id,
        codeHash: row.codeHash,
        attempts: row.attempts,
        signup: row.signup as SignupProfile | null,
      }
    );
  }

  async addAttempt(id: string) {
    await this.db.otpCode.update({ where: { id }, data: { attempts: { increment: 1 } } });
  }

  async consumeCode(id: string) {
    const { count } = await this.db.otpCode.updateMany({
      where: { id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    return count === 1;
  }

  findUser(provider: string, subject: string) {
    return this.db.user.findFirst({
      where: { identities: { some: { provider, subject } } },
      select: summary,
    });
  }

  async createUser(profile: SignupProfile, channel: 'email' | 'sms', destination: string) {
    const now = new Date();
    try {
      return await this.db.user.create({
        data: {
          firstName: profile.firstName,
          goal: profile.goal,
          goals: profile.goals,
          interests: profile.interests,
          birthYear: profile.birthYear,
          phoneE164: profile.phone,
          phoneVerifiedAt: channel === 'sms' ? now : null,
          smsOptIn: profile.smsOptIn,
          identities: {
            create: {
              provider: channel === 'email' ? 'email' : 'phone',
              subject: destination,
              verifiedAt: now,
            },
          },
        },
        select: summary,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return null;
      throw e;
    }
  }

  async saveRefreshToken(row: Parameters<AccountStore['saveRefreshToken']>[0]) {
    await this.db.refreshToken.create({ data: row });
  }
}
