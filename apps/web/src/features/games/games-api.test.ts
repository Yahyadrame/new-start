import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GamesError,
  matchQuestions,
  sendMissed,
  sendResult,
  trueFalseQuestions,
  fetchDaily,
  fetchDueReviews,
  gradeReview,
  fetchStreak,
  sendDailyResult,
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

describe('fetchStreak', () => {
  it('rend la série de jours lue dans le progrès', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ streakDays: 4, xp: 250 }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchStreak('tok')).toBe(4);
    expect(fetchMock).toHaveBeenCalledWith('/api/progress', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('lève GamesError quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(fetchStreak('tok')).rejects.toBeInstanceOf(GamesError);
  });
});

describe('fetchDaily', () => {
  it('lit le défi du jour avec le jeton', async () => {
    const body = { done: false, questions: [] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchDaily('tok')).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith('/api/games/daily', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('lève GamesError quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchDaily('tok')).rejects.toBeInstanceOf(GamesError);
  });
});

describe('sendDailyResult', () => {
  it('envoie le score et rend l’XP et le bonus', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ gained: 55, bonus: 20, xp: 90 }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendDailyResult('tok', 7)).toEqual({ gained: 55, bonus: 20, xp: 90 });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/games/daily/results');
    expect(init.body).toBe(JSON.stringify({ correct: 7 }));
  });

  it('lève GamesError quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    await expect(sendDailyResult('tok', 99)).rejects.toBeInstanceOf(GamesError);
  });
});

describe('fetchDueReviews', () => {
  it('lit les cartes dues avec le jeton', async () => {
    const cards = [{ id: 'c1', expressionId: 1, text: 'You know', meaningFr: 'tu sais', due: 'x' }];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => cards });
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchDueReviews('tok')).toEqual(cards);
    expect(fetchMock).toHaveBeenCalledWith('/api/reviews/due', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('lève GamesError quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchDueReviews('tok')).rejects.toBeInstanceOf(GamesError);
  });
});

describe('gradeReview', () => {
  it('envoie la note de la carte', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await gradeReview('tok', 'c1', 'good');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/reviews/c1/grade');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ grade: 'good' }));
  });

  it('lève GamesError quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(gradeReview('tok', 'c1', 'easy')).rejects.toBeInstanceOf(GamesError);
  });
});
