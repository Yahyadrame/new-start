import { describe, expect, it } from 'vitest';
import type { Queue } from '../domain/queue.js';
import { DEMO_JOB, DemoJob } from './demo.job.js';

function fakeQueue() {
  const handlers = new Map<string, (p: never) => Promise<void>>();
  const queue: Queue = {
    subscribe: (name, handler) => void handlers.set(name, handler as (p: never) => Promise<void>),
    publish: async (name, payload) => handlers.get(name)?.(payload as never),
  };
  return queue;
}

describe('DemoJob', () => {
  it('compte les jobs consommés une fois abonné', async () => {
    const queue = fakeQueue();
    const job = new DemoJob(queue);
    job.onModuleInit();
    await queue.publish(DEMO_JOB, { at: 1 });
    await queue.publish(DEMO_JOB, { at: 2 });
    expect(job.handled).toBe(2);
  });
});
