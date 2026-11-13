import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HealthCheck } from '../domain/health-check.js';
import { CHECK_TIMEOUT_MS, CheckReadiness } from './check-readiness.js';

const check = (name: string, run: () => Promise<void>): HealthCheck => ({ name, check: run });

afterEach(() => vi.useRealTimers());

describe('CheckReadiness', () => {
  it('est prêt quand toutes les dépendances répondent', async () => {
    const result = await new CheckReadiness([check('database', async () => {})]).execute();
    expect(result).toEqual({ ready: true, checks: { database: 'up' } });
  });

  it('signale la dépendance en panne et les autres restent « up »', async () => {
    const result = await new CheckReadiness([
      check('database', async () => {}),
      check('redis', () => Promise.reject(new Error('ECONNREFUSED'))),
    ]).execute();
    expect(result).toEqual({ ready: false, checks: { database: 'up', redis: 'down' } });
  });

  it('compte une dépendance trop lente comme en panne', async () => {
    vi.useFakeTimers();
    const pending = new CheckReadiness([check('database', () => new Promise(() => {}))]).execute();
    await vi.advanceTimersByTimeAsync(CHECK_TIMEOUT_MS);
    expect(await pending).toEqual({ ready: false, checks: { database: 'down' } });
  });

  it('est prêt sans aucune dépendance à vérifier', async () => {
    expect(await new CheckReadiness([]).execute()).toEqual({ ready: true, checks: {} });
  });
});
