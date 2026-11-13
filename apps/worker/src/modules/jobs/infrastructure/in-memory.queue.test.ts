import { describe, expect, it, vi } from 'vitest';
import { InMemoryQueue } from './in-memory.queue.js';

describe('InMemoryQueue', () => {
  it('livre le payload à chaque abonné du job', async () => {
    const queue = new InMemoryQueue();
    const a = vi.fn().mockResolvedValue(undefined);
    const b = vi.fn().mockResolvedValue(undefined);
    queue.subscribe('x', a);
    queue.subscribe('x', b);
    await queue.publish('x', { n: 1 });
    expect(a).toHaveBeenCalledWith({ n: 1 });
    expect(b).toHaveBeenCalledWith({ n: 1 });
  });
  it('ignore un job sans abonné', async () => {
    await expect(new InMemoryQueue().publish('rien', {})).resolves.toBeUndefined();
  });
  it('un handler en échec ne bloque ni les autres ni l’émetteur', async () => {
    const queue = new InMemoryQueue();
    const ok = vi.fn().mockResolvedValue(undefined);
    queue.subscribe('x', () => Promise.reject(new Error('boom')));
    queue.subscribe('x', () => Promise.reject('texte'));
    queue.subscribe('x', ok);
    await expect(queue.publish('x', {})).resolves.toBeUndefined();
    expect(ok).toHaveBeenCalledOnce();
  });
});
