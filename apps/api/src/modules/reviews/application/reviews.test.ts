import { describe, expect, it, vi } from 'vitest';
import { newCard } from '../domain/scheduler.js';
import { ReviewsService, type ReviewsStore } from './reviews.js';

const now = new Date('2026-11-20T12:00:00Z');

function setup(found: ReturnType<typeof newCard> | null = newCard(now)) {
  const store: ReviewsStore = {
    due: vi
      .fn()
      .mockResolvedValue([
        { id: 'c1', expressionId: 7, text: 'Break a leg', meaningFr: 'Bonne chance', due: now },
      ]),
    find: vi.fn().mockResolvedValue(found),
    save: vi.fn().mockResolvedValue(undefined),
  };
  return { store, service: new ReviewsService(store) };
}

describe('ReviewsService.listDue', () => {
  it('rend les cartes échues avec une date en texte', async () => {
    const { store, service } = setup();
    expect(await service.listDue('u1', now)).toEqual([
      {
        id: 'c1',
        expressionId: 7,
        text: 'Break a leg',
        meaningFr: 'Bonne chance',
        due: '2026-11-20T12:00:00.000Z',
      },
    ]);
    expect(store.due).toHaveBeenCalledWith('u1', now, 20);
  });
});

describe('ReviewsService.grade', () => {
  it('calcule la carte suivante, l’enregistre et rend la nouvelle échéance', async () => {
    const { store, service } = setup();
    const { due } = await service.grade('u1', 'c1', 'good', now);
    expect(new Date(due).getTime()).toBeGreaterThan(now.getTime());
    expect(store.find).toHaveBeenCalledWith('u1', 'c1');
    const saved = vi.mocked(store.save).mock.calls[0];
    expect(saved?.[0]).toBe('c1');
    expect(saved?.[1]).toMatchObject({ reps: 1, lastReview: now });
  });

  it('répond 404 quand la carte est introuvable ou n’est pas à cette personne', async () => {
    const { store, service } = setup(null);
    await expect(service.grade('u1', 'c9', 'good', now)).rejects.toMatchObject({ status: 404 });
    expect(store.save).not.toHaveBeenCalled();
  });
});
