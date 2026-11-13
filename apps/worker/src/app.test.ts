import { describe, expect, it } from 'vitest';

process.env['LOG_LEVEL'] = 'silent';
const { createWorker } = await import('./app.js');
const { QUEUE } = await import('./modules/jobs/domain/queue.js');
const { DEMO_JOB, DemoJob } = await import('./modules/jobs/application/demo.job.js');

describe('worker', () => {
  it('démarre, consomme le job de démonstration puis se ferme proprement', async () => {
    const app = await createWorker();
    await app
      .get<{ publish(n: string, p: unknown): Promise<void> }>(QUEUE)
      .publish(DEMO_JOB, { at: 1 });
    expect(app.get(DemoJob).handled).toBe(1);
    await expect(app.close()).resolves.toBeUndefined();
  });
});
