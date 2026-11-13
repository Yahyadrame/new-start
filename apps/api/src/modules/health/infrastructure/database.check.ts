import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { HealthCheck } from '../domain/health-check.js';

@Injectable()
export class DatabaseCheck implements HealthCheck {
  readonly name = 'database';
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async check(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
