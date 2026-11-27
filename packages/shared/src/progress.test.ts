import { describe, expect, it } from 'vitest';
import { type DayActivity, ProgressSummary, summarize } from './progress.js';

describe('summarize', () => {
  it('démarre au niveau 1 sans XP', () => {
    expect(summarize(0, 0, [], '2026-11-21')).toMatchObject({
      xp: 0,
      level: 1,
      levelXp: 0,
      nextLevelXp: 100,
      streakDays: 0,
      figures: { messages: 0, games: 0, weekXp: 0, activeDays: 0 },
    });
  });

  it('reste dans le niveau tant que le palier n’est pas atteint', () => {
    expect(summarize(99)).toMatchObject({ level: 1, levelXp: 99 });
  });

  it('passe au niveau suivant au palier et garde le reste', () => {
    expect(summarize(100)).toMatchObject({ level: 2, levelXp: 0 });
    expect(summarize(250)).toMatchObject({ level: 3, levelXp: 50 });
  });

  it('reprend la série de jours donnée', () => {
    expect(summarize(10, 6).streakDays).toBe(6);
  });

  describe('activité des 7 derniers jours', () => {
    const row = (day: string, over: Partial<DayActivity> = {}): DayActivity => ({
      day,
      spokenSeconds: 0,
      messagesSent: 0,
      voiceSent: 0,
      photosSent: 0,
      gamesPlayed: 0,
      xpEarned: 0,
      ...over,
    });

    it('rend 7 jours du plus ancien à aujourd’hui, même d’un mois à l’autre', () => {
      const { week } = summarize(0, 0, [], '2026-12-02');
      expect(week.map((d) => d.day)).toEqual([
        '2026-11-26',
        '2026-11-27',
        '2026-11-28',
        '2026-11-29',
        '2026-11-30',
        '2026-12-01',
        '2026-12-02',
      ]);
    });

    it('arrondit les minutes parlées', () => {
      const { week } = summarize(0, 0, [row('2026-11-21', { spokenSeconds: 150 })], '2026-11-21');
      expect(week[6]).toEqual({ day: '2026-11-21', minutes: 3 });
    });

    it('additionne les chiffres clés et compte les jours actifs', () => {
      const activity = [
        row('2026-11-21', { messagesSent: 4, xpEarned: 40 }),
        row('2026-11-19', { messagesSent: 2, gamesPlayed: 1, xpEarned: 25 }),
        row('2026-11-18', { spokenSeconds: 600 }), // parlé seulement : pas un jour actif compté ici
      ];
      expect(summarize(65, 3, activity, '2026-11-21').figures).toEqual({
        messages: 6,
        games: 1,
        weekXp: 65,
        activeDays: 2,
      });
    });

    it('compte les vocaux et les photos comme des messages envoyés', () => {
      const activity = [
        row('2026-11-21', { messagesSent: 4, voiceSent: 2, photosSent: 1 }),
        row('2026-11-20', { voiceSent: 1 }),
        row('2026-11-19', { photosSent: 1 }),
      ];
      expect(summarize(0, 0, activity, '2026-11-21').figures).toMatchObject({
        messages: 9,
        activeDays: 3,
      });
    });

    it('ignore les jours hors de la semaine', () => {
      const old = row('2026-11-10', { messagesSent: 9, xpEarned: 90 });
      expect(summarize(90, 0, [old], '2026-11-21').figures.messages).toBe(0);
    });
  });

  it('rend un résumé valide pour le schéma', () => {
    expect(ProgressSummary.safeParse(summarize(1234)).success).toBe(true);
  });
});
