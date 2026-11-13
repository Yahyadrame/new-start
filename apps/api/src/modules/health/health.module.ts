import { Module } from '@nestjs/common';
import { CheckReadiness } from './application/check-readiness.js';
import { HEALTH_CHECKS } from './domain/health-check.js';
import { DatabaseCheck } from './infrastructure/database.check.js';
import { RedisCheck } from './infrastructure/redis.check.js';
import { HealthController } from './interface/health.controller.js';

@Module({
  controllers: [HealthController],
  providers: [
    DatabaseCheck,
    RedisCheck,
    CheckReadiness,
    {
      provide: HEALTH_CHECKS,
      useFactory: (db: DatabaseCheck, redis: RedisCheck) => (redis.enabled ? [db, redis] : [db]),
      inject: [DatabaseCheck, RedisCheck],
    },
  ],
})
export class HealthModule {}
