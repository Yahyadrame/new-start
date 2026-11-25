import { describe, expect, it } from 'vitest';
import { CHAT_BACKGROUNDS, MePatch } from './settings.js';

const future = new Date(Date.now() + 86_400_000).toISOString();

describe('MePatch', () => {
  it('accepte une ou plusieurs modifications valides', () => {
    expect(MePatch.safeParse({ theme: 'DARK' }).success).toBe(true);
    expect(
      MePatch.safeParse({
        firstName: ' Awa ',
        reminderTime: '19:30',
        dailyGoalMin: 30,
        preferredAccent: 'en-GB',
        dataSaver: true,
        pausedUntil: future,
      }).success,
    ).toBe(true);
  });

  it('accepte chaque fond de conversation et refuse les autres', () => {
    for (const chatBackground of CHAT_BACKGROUNDS) {
      expect(MePatch.safeParse({ chatBackground }).success).toBe(true);
    }
    expect(CHAT_BACKGROUNDS[0]).toBe('NONE');
    expect(MePatch.safeParse({ chatBackground: 'MATISSE' }).success).toBe(false);
    expect(MePatch.safeParse({ chatBackground: 'dots' }).success).toBe(false);
  });

  it('accepte de retirer le rappel et la pause', () => {
    expect(MePatch.safeParse({ reminderTime: null, pausedUntil: null }).success).toBe(true);
  });

  it('refuse un corps vide ou une clé inconnue', () => {
    expect(MePatch.safeParse({}).success).toBe(false);
    expect(MePatch.safeParse({ xp: 9999 }).success).toBe(false);
  });

  it.each([
    { theme: 'PINK' },
    { reminderTime: '25:00' },
    { reminderTime: '9:00' },
    { dailyGoalMin: 4 },
    { dailyGoalMin: 121 },
    { preferredAccent: 'fr-FR' },
    { firstName: 'A' },
    { pausedUntil: '2020-01-01T00:00:00Z' },
    { pausedUntil: 'demain' },
  ])('refuse %j', (patch) => {
    expect(MePatch.safeParse(patch).success).toBe(false);
  });

  it('accepte l’année de naissance et les centres d’intérêt, sans vider la liste quand on ne la touche pas', () => {
    const year = new Date().getFullYear();
    expect(MePatch.parse({ birthYear: year - 20, interests: ['MUSIC'] })).toEqual({
      birthYear: year - 20,
      interests: ['MUSIC'],
    });
    expect(MePatch.parse({ firstName: 'Awa' })).toEqual({ firstName: 'Awa' });
  });
  it('refuse moins de 13 ans, une année absurde, trop de centres d’intérêt ou un inconnu', () => {
    const year = new Date().getFullYear();
    expect(MePatch.safeParse({ birthYear: year - 12 }).success).toBe(false);
    expect(MePatch.safeParse({ birthYear: 1800 }).success).toBe(false);
    expect(MePatch.safeParse({ interests: ['MAGIC'] }).success).toBe(false);
    const nine = ['MUSIC', 'SPORT', 'ART', 'TECH', 'BOOKS', 'FAITH', 'NATURE', 'FASHION', 'GAMING'];
    expect(MePatch.safeParse({ interests: nine }).success).toBe(false);
  });
});
