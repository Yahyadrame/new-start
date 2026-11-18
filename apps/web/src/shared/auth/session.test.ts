import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureSession, getSession, setSession, type Session } from './session';

const session: Session = {
  accessToken: 'a',
  expiresInSeconds: 900,
  user: { id: 'u1', firstName: 'Awa', goal: 'WORK', level: 'A1' },
};

describe('session en mémoire', () => {
  it('garde la session puis la perd quand on la vide', () => {
    expect(getSession()).toBeNull();
    setSession(session);
    expect(getSession()).toBe(session);
    setSession(null);
    expect(getSession()).toBeNull();
  });
});

describe('ensureSession', () => {
  const next = { ...session, accessToken: 'b' };
  beforeEach(() => {
    setSession(null);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  const stub = (init: object) => {
    const fetchMock = vi.fn().mockResolvedValue(init);
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  it('rend la session en mémoire tant que son jeton est valable', async () => {
    const fetchMock = stub({ ok: true });
    setSession(session);
    expect(await ensureSession()).toBe(session);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rouvre la session avec le cookie quand la mémoire est vide', async () => {
    const fetchMock = stub({ ok: true, json: async () => next });
    expect(await ensureSession()).toEqual(next);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/refresh', { method: 'POST' });
    expect(getSession()).toEqual(next);
  });

  it('renouvelle le jeton une minute avant son échéance', async () => {
    const fetchMock = stub({ ok: true, json: async () => next });
    setSession(session);
    vi.advanceTimersByTime(900_000 - 59_000);
    expect(await ensureSession()).toEqual(next);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('partage un seul renouvellement entre appels simultanés', async () => {
    const fetchMock = stub({ ok: true, json: async () => next });
    await Promise.all([ensureSession(), ensureSession()]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('rend null sans cookie valable ou si le réseau tombe', async () => {
    stub({ ok: false, status: 401 });
    expect(await ensureSession()).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    expect(await ensureSession()).toBeNull();
  });
});
