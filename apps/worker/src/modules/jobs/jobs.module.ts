import { Module } from '@nestjs/common';
import { DemoJob } from './application/demo.job.js';
import { QUEUE } from './domain/queue.js';
import { InMemoryQueue } from './infrastructure/in-memory.queue.js';

@Module({
  providers: [DemoJob, { provide: QUEUE, useClass: InMemoryQueue }],
  exports: [QUEUE],
})
export class JobsModule {}
