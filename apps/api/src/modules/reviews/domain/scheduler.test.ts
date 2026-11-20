import { describe, expect, it } from 'vitest';
import { gradeCard, newCard } from './scheduler.js';

const now = new Date('2026-11-20T12:00:00Z');
const day = 86_400_000;

describe('newCard', () => {
  it('est due tout de suite, sans historique', () => {
    expect(newCard(now)).toEqual({
      stability: 0,
      difficulty: 0,
      due: now,
      reps: 0,
      lapses: 0,
      lastReview: null,
    });
  });
});

describe('gradeCard', () => {
  it('une bonne réponse repousse l’échéance d’au moins un jour et compte une répétition', () => {
    const next = gradeCard(newCard(now), 'good', now);
    expect(next.reps).toBe(1);
    expect(next.lapses).toBe(0);
    expect(next.stability).toBeGreaterThan(0);
    expect(next.due.getTime()).toBeGreaterThanOrEqual(now.getTime() + day);
    expect(next.lastReview).toEqual(now);
  });

  it('plus la réponse est facile, plus l’échéance est lointaine', () => {
    const due = (g: 'again' | 'hard' | 'good' | 'easy') =>
      gradeCard(newCard(now), g, now).due.getTime();
    expect(due('again')).toBeLessThanOrEqual(due('hard'));
    expect(due('hard')).toBeLessThanOrEqual(due('good'));
    expect(due('good')).toBeLessThan(due('easy'));
  });

  it('un oubli sur une carte mûre ajoute un lapse et raccourcit l’intervalle', () => {
    const mature = gradeCard(
      gradeCard(newCard(now), 'good', now),
      'good',
      new Date(now.getTime() + 3 * day),
    );
    const later = new Date(mature.due);
    const forgotten = gradeCard(mature, 'again', later);
    const remembered = gradeCard(mature, 'good', later);
    expect(forgotten.lapses).toBe(mature.lapses + 1);
    expect(forgotten.due.getTime()).toBeLessThan(remembered.due.getTime());
    expect(forgotten.stability).toBeLessThan(mature.stability);
  });

  it('ne modifie pas la carte reçue', () => {
    const card = newCard(now);
    const copy = { ...card };
    gradeCard(card, 'easy', now);
    expect(card).toEqual(copy);
  });
});
