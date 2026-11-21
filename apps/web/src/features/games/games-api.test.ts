import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GamesError,
  matchQuestions,
  sendMissed,
  sendResult,
  trueFalseQuestions,
} from './games-api';

afterEach(() => vi.unstubAllGlobals());

describe('trueFalseQuestions', () => {
  it('appelle la route avec le jeton et le nombre demandé', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [{ kind: 'TRUE_FALSE' }] });
    vi.stubGlobal('fetch', fetchMock);
    expect(await trueFalseQuestions('tok', 5)).toEqual([{ kind: 'TRUE_FALSE' }]);
    expect(fetchMock).toHaveBeenCalledWith('/api/games/true-false/questions?count=5', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('demande 10 questions par défaut', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    await trueFalseQuestions('tok');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('count=10');
  });

  it('lève GamesError avec le statut quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(trueFalseQuestions('tok')).rejects.toMatchObject({ status: 401 });
    await expect(trueFalseQuestions('tok')).rejects.toBeInstanceOf(GamesError);
  });
});

describe('matchQuestions', () => {
  it('demande trois tableaux par défaut', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    await matchQuestions('tok');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/games/match/questions?count=3');
  });
});

describe('sendMissed', () => {
  it('n’appelle rien quand rien n’est raté', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await sendMissed('tok', []);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envoie les identifiants avec le jeton', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await sendMissed('tok', [1, 2]);
    expect(fetchMock).toHaveBeenCalledWith('/api/reviews/missed', {
      method: 'POST',
      headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: '{"expressionIds":[1,2]}',
    });
  });

  it('lève GamesError quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(sendMissed('tok', [1])).rejects.toBeInstanceOf(GamesError);
  });
});

describe('sendResult', () => {
  it('envoie le nombre de bonnes réponses et rend l’XP gagné', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ gained: 15, xp: 40 }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendResult('tok', 3)).toBe(15);
    expect(fetchMock).toHaveBeenCalledWith('/api/games/results', {
      method: 'POST',
      headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: '{"correct":3}',
    });
  });

  it('lève GamesError quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    await expect(sendResult('tok', 99)).rejects.toBeInstanceOf(GamesError);
  });
});
