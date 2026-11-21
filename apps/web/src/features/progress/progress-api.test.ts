import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchProgress, ProgressError } from './progress-api';

afterEach(() => vi.unstubAllGlobals());

describe('fetchProgress', () => {
  it('lit le résumé avec le jeton', async () => {
    const summary = { xp: 250, level: 3, levelXp: 50, nextLevelXp: 100 };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => summary });
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchProgress('tok')).toEqual(summary);
    expect(fetchMock).toHaveBeenCalledWith('/api/progress', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('lève ProgressError quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(fetchProgress('tok')).rejects.toBeInstanceOf(ProgressError);
  });
});
