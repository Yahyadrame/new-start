import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from '../domain/queue.js';

type Handler = (payload: never) => Promise<void>;

/** Les jobs sont perdus à l'arrêt du processus : suffisant pour la phase 1 (aperçu en ligne). */
@Injectable()
export class InMemoryQueue implements Queue {
  private readonly logger = new Logger(InMemoryQueue.name);
  private readonly handlers = new Map<string, Handler[]>();

  subscribe<T>(name: string, handler: (payload: T) => Promise<void>): void {
    this.handlers.set(name, [...(this.handlers.get(name) ?? []), handler as Handler]);
  }

  async publish<T>(name: string, payload: T): Promise<void> {
    for (const handler of this.handlers.get(name) ?? []) {
      // Un job en échec ne bloque ni les autres handlers ni l'émetteur. Jamais de payload dans les logs.
      await (handler as (p: T) => Promise<void>)(payload).catch((error: unknown) =>
        this.logger.error(
          { job: name, error: error instanceof Error ? error.message : 'unknown' },
          'job failed',
        ),
      );
    }
  }
}
