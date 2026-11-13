import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { QUEUE, type Queue } from '../domain/queue.js';

export const DEMO_JOB = 'demo.ping';

/** Job de démonstration : prouve que le worker consomme la file. Sera remplacé par les vrais jobs (IA, voix). */
@Injectable()
export class DemoJob implements OnModuleInit {
  private readonly logger = new Logger(DemoJob.name);
  handled = 0;

  constructor(@Inject(QUEUE) private readonly queue: Queue) {}

  onModuleInit(): void {
    this.queue.subscribe<{ at: number }>(DEMO_JOB, async () => {
      this.handled += 1;
      this.logger.log({ job: DEMO_JOB, handled: this.handled }, 'job handled');
    });
  }
}
