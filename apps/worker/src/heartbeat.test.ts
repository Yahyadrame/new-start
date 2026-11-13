import { mkdtempSync, statSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startHeartbeat } from './heartbeat.js';

describe('startHeartbeat', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'hb-')), 'alive');
  beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] }));
  afterEach(() => vi.useRealTimers());

  it('crée le fichier, le rafraîchit à chaque intervalle, puis s’arrête', () => {
    const stop = startHeartbeat(file, 1000);
    expect(statSync(file).isFile()).toBe(true);
    utimesSync(file, new Date(0), new Date(0));
    vi.advanceTimersByTime(1000);
    expect(statSync(file).mtimeMs).toBeGreaterThan(0);
    stop();
    utimesSync(file, new Date(0), new Date(0));
    vi.advanceTimersByTime(5000);
    expect(statSync(file).mtimeMs).toBe(0);
  });
});
