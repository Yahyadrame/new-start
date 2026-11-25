import { describe, expect, it } from 'vitest';
import { AWAY_MS, durationFor, pickTrack, shouldReplay, TIMELINE } from './timeline';

describe('pickTrack', () => {
  it('joue « La correction » à la toute première ouverture', () => {
    expect(pickTrack({ getItem: () => null })).toBe('first');
  });
  it("joue « La bulle s'ouvre » ensuite", () => {
    expect(pickTrack({ getItem: () => '1' })).toBe('regular');
  });
  it("retombe sur « La bulle s'ouvre » si le stockage échoue", () => {
    expect(
      pickTrack({
        getItem: () => {
          throw new Error('bloqué');
        },
      }),
    ).toBe('regular');
  });
});

describe('durationFor', () => {
  it('donne 2,7 s, 1,3 s ou 0,4 s si les animations sont réduites', () => {
    expect(durationFor('first', false)).toBe(2700);
    expect(durationFor('regular', false)).toBe(1300);
    expect(durationFor('first', true)).toBe(TIMELINE.reduced);
  });
});

describe('shouldReplay', () => {
  it('rejoue après 5 minutes ou plus loin de l’appli', () => {
    expect(shouldReplay(1000, 1000 + AWAY_MS)).toBe(true);
    expect(shouldReplay(1000, 1000 + AWAY_MS + 1)).toBe(true);
  });
  it('ne rejoue pas pour une absence courte ou sans départ noté', () => {
    expect(shouldReplay(1000, 1000 + AWAY_MS - 1)).toBe(false);
    expect(shouldReplay(null, 99_999_999)).toBe(false);
  });
});
