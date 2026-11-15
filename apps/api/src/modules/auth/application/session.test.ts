import { describe, expect, it } from 'vitest';
import { createAccessSigner, hashRefreshToken } from '../domain/tokens.js';
import { SessionService, type SessionStore, type StoredToken } from './session.js';

const NOW = new Date('2026-11-15T12:00:00Z');
const user = { id: 'u1', firstName: 'Awa', goal: 'WORK', level: 'A1' };

function setup(token: Partial<StoredToken> | null, opts: { user?: boolean } = {}) {
  const tokens = new Map<string, StoredToken>();
  if (token) {
    tokens.set(hashRefreshToken('old'), {
      id: 't1',
      userId: 'u1',
      familyId: 'f1',
      expiresAt: new Date(NOW.getTime() + 1000),
      revokedAt: null,
      ...token,
    });
  }
  const added: { tokenHash: string; familyId: string; expiresAt: Date }[] = [];
  const revokedFamilies: string[] = [];
  const store: SessionStore = {
    findToken: async (h) => tokens.get(h) ?? null,
    revokeToken: async (id) => {
      const t = [...tokens.values()].find((x) => x.id === id);
      if (!t || t.revokedAt) return false;
      t.revokedAt = NOW;
      return true;
    },
    revokeFamily: async (f) => {
      revokedFamilies.push(f);
    },
    addToken: async (row) => {
      added.push(row);
    },
    findUserById: async () => (opts.user === false ? null : user),
  };
  return {
    added,
    revokedFamilies,
    tokens,
    svc: new SessionService(store, createAccessSigner(), () => NOW),
  };
}
const code = (p: Promise<unknown>) =>
  p.then(
    () => 'ok',
    (e) => e.response?.code,
  );

describe('SessionService.refresh', () => {
  it("révoque l'ancien jeton et en émet un nouveau dans la même famille", async () => {
    const { svc, added, tokens } = setup({});
    const s = await svc.refresh('old');
    expect(s.refreshToken).not.toBe('old');
    expect(s.accessToken.split('.')).toHaveLength(3);
    expect(added[0]).toMatchObject({ familyId: 'f1', tokenHash: hashRefreshToken(s.refreshToken) });
    expect(added[0]?.expiresAt.getTime()).toBe(NOW.getTime() + 30 * 86_400_000);
    expect(tokens.get(hashRefreshToken('old'))?.revokedAt).toEqual(NOW);
  });
  it('refuse un jeton inconnu', async () => {
    expect(await code(setup(null).svc.refresh('old'))).toBe('INVALID_REFRESH_TOKEN');
  });
  it('coupe toute la famille quand un jeton déjà utilisé revient', async () => {
    const { svc, revokedFamilies, added } = setup({ revokedAt: NOW });
    expect(await code(svc.refresh('old'))).toBe('INVALID_REFRESH_TOKEN');
    expect(revokedFamilies).toEqual(['f1']);
    expect(added).toHaveLength(0);
  });
  it('traite deux appels simultanés comme une réutilisation', async () => {
    const { svc, revokedFamilies } = setup({});
    await svc.refresh('old');
    expect(await code(svc.refresh('old'))).toBe('INVALID_REFRESH_TOKEN');
    expect(revokedFamilies).toEqual(['f1']);
  });
  it('refuse un jeton expiré ou un compte disparu, sans émettre de jeton', async () => {
    const expired = setup({ expiresAt: new Date(NOW.getTime() - 1) });
    expect(await code(expired.svc.refresh('old'))).toBe('INVALID_REFRESH_TOKEN');
    const gone = setup({}, { user: false });
    expect(await code(gone.svc.refresh('old'))).toBe('INVALID_REFRESH_TOKEN');
    expect(expired.added.length + gone.added.length).toBe(0);
  });
});

describe('SessionService.logout', () => {
  it('révoque la famille du jeton', async () => {
    const { svc, revokedFamilies } = setup({});
    await svc.logout('old');
    expect(revokedFamilies).toEqual(['f1']);
  });
  it('ignore un jeton inconnu', async () => {
    const { svc, revokedFamilies } = setup(null);
    await svc.logout('old');
    expect(revokedFamilies).toHaveLength(0);
  });
});
