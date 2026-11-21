import { afterEach, describe, expect, it, vi } from 'vitest';
import { RemindersScheduler } from './reminders-scheduler.js';

afterEach(() => vi.useRealTimers());

describe('RemindersScheduler', () => {
  it('lance les rappels à chaque intervalle, jusqu’à l’arrêt', async () => {
    vi.useFakeTimers();
    const run = vi.fn().mockResolvedValue(0);
    const s = new RemindersScheduler(run, 60);
    s.start();
    s.start(); // un seul minuteur
    await vi.advanceTimersByTimeAsync(120_000);
    expect(run).toHaveBeenCalledTimes(2);
    s.stop();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('ne démarre pas quand l’intervalle est 0', async () => {
    vi.useFakeTimers();
    const run = vi.fn().mockResolvedValue(0);
    new RemindersScheduler(run, 0).start();
    await vi.advanceTimersByTimeAsync(600_000);
    expect(run).not.toHaveBeenCalled();
  });

  it('survit à une erreur : le passage suivant réessaie', async () => {
    vi.useFakeTimers();
    const run = vi.fn().mockRejectedValueOnce(new Error('base')).mockResolvedValue(2);
    const s = new RemindersScheduler(run, 60);
    s.start();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(run).toHaveBeenCalledTimes(2);
    s.stop();
  });

  it('passe l’heure courante à tick', async () => {
    const run = vi.fn().mockResolvedValue(1);
    const now = new Date('2026-11-21T19:00:00Z');
    await new RemindersScheduler(run, 60).tick(now);
    expect(run).toHaveBeenCalledWith(now);
  });
});
