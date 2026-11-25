import { describe, expect, it } from 'vitest';
import { durationFor, pickTrack, TIMELINE } from './timeline';

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
