import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ENV, type Env } from '../../../config/env.js';
import type { HealthCheck } from '../domain/health-check.js';

@Injectable()
export class RedisCheck implements HealthCheck, OnModuleDestroy {
  readonly name = 'redis';
  readonly enabled: boolean;
  private readonly client: Redis | undefined;

  constructor(@Inject(ENV) env: Env) {
    this.enabled = env.REDIS_URL !== undefined;
    this.client = env.REDIS_URL
      ? new Redis(env.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        })
      : undefined;
  }

  async check(): Promise<void> {
    if (!this.client) throw new Error('Redis non configuré');
    if (this.client.status === 'wait') await this.client.connect();
    await this.client.ping();
  }

  onModuleDestroy(): void {
    this.client?.disconnect();
  }
}
