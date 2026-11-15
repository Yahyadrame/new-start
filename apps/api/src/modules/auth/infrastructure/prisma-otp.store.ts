import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { OtpStore } from '../application/request-otp.js';

@Injectable()
export class PrismaOtpStore implements OtpStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  countSince(destination: string, since: Date): Promise<number> {
    return this.db.otpCode.count({ where: { destination, createdAt: { gt: since } } });
  }

  create(row: Parameters<OtpStore['create']>[0]): Promise<{ id: string }> {
    return this.db.otpCode.create({
      data: { ...row, signup: row.signup ?? Prisma.DbNull },
      select: { id: true },
    });
  }

  async remove(id: string): Promise<void> {
    await this.db.otpCode.delete({ where: { id } });
  }
}
