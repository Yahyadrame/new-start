import { beforeEach, describe, expect, it, vi } from 'vitest';
import { multiplier, pointsFor, readRecord, saveRecord } from './time-attack';

beforeEach(() => localStorage.clear());

describe('combo', () => {
  it('passe à x2 puis x3 aux paliers', () => {
    expect([0, 2, 3, 5, 6, 12].map(multiplier)).toEqual([1, 1, 2, 2, 3, 3]);
  });
  it('compte la bonne réponse qui franchit le palier', () => {
    expect([0, 1, 2, 4, 5].map(pointsFor)).toEqual([10, 10, 20, 20, 30]);
  });
});

describe('record', () => {
  it('vaut 0 sans partie', () => expect(readRecord()).toBe(0));
  it('ne garde que le meilleur score', () => {
    saveRecord(50);
    saveRecord(30);
    expect(readRecord()).toBe(50);
  });
  it('ne plante pas quand le stockage est indisponible', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqué');
    });
    expect(readRecord()).toBe(0);
    spy.mockRestore();
  });
});
