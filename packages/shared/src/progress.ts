import { z } from 'zod';

/** XP à gagner pour passer d'un niveau au suivant. */
// ponytail: palier fixe ; des paliers croissants si les niveaux montent trop vite
export const XP_PER_LEVEL = 100;

/** Activité d'un jour, telle que `DailyActivity` la compte. */
export interface DayActivity {
  /** Jour local, `AAAA-MM-JJ`. */
  day: string;
  spokenSeconds: number;
  /** Messages écrits ; les vocaux et les photos ont leur compteur. */
  messagesSent: number;
  voiceSent: number;
  photosSent: number;
  gamesPlayed: number;
  xpEarned: number;
}

/** Réponse de `GET /progress` : niveau, XP total et avancement vers le niveau suivant. */
export const ProgressSummary = z.object({
  xp: z.number().int().min(0),
  level: z.number().int().min(1),
  /** XP gagnés dans le niveau en cours. */
  levelXp: z.number().int().min(0),
  /** XP à gagner pour passer au niveau suivant. */
  nextLevelXp: z.number().int().min(1),
  /** Jours de suite avec une activité (0 si la série est rompue). */
  streakDays: z.number().int().min(0),
  /** Minutes parlées des 7 derniers jours, du plus ancien à aujourd'hui. */
  week: z.array(z.object({ day: z.string(), minutes: z.number().int().min(0) })).length(7),
  /** Les 4 chiffres clés : messages et parties sur 7 jours, XP de la semaine, jours actifs. */
  figures: z.object({
    messages: z.number().int().min(0),
    games: z.number().int().min(0),
    weekXp: z.number().int().min(0),
    activeDays: z.number().int().min(0).max(7),
  }),
});
export type ProgressSummary = z.infer<typeof ProgressSummary>;

/** Les 7 jours qui finissent à `today` (`AAAA-MM-JJ`), du plus ancien au plus récent. */
function lastSevenDays(today: string): string[] {
  const end = Date.parse(`${today}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(end - (6 - i) * 86_400_000).toISOString().slice(0, 10),
  );
}

/**
 * Niveau d'après le total d'XP (niveau 1 à 0 XP), plus la série et l'activité des
 * 7 derniers jours. `activity` peut contenir d'autres jours : ils sont ignorés.
 */
export function summarize(
  xp: number,
  streakDays = 0,
  activity: DayActivity[] = [],
  today = new Date().toISOString().slice(0, 10),
): ProgressSummary {
  const byDay = new Map(activity.map((a) => [a.day, a]));
  const days = lastSevenDays(today).map((day) => ({ day, row: byDay.get(day) }));
  const sum = (pick: (a: DayActivity) => number) =>
    days.reduce((total, { row }) => total + (row ? pick(row) : 0), 0);
  const sent = (a: DayActivity) => a.messagesSent + a.voiceSent + a.photosSent;
  return {
    xp,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    levelXp: xp % XP_PER_LEVEL,
    nextLevelXp: XP_PER_LEVEL,
    streakDays,
    week: days.map(({ day, row }) => ({
      day,
      minutes: Math.round((row?.spokenSeconds ?? 0) / 60),
    })),
    figures: {
      messages: sum(sent),
      games: sum((a) => a.gamesPlayed),
      weekXp: sum((a) => a.xpEarned),
      activeDays: days.filter(({ row }) => row && sent(row) + row.gamesPlayed > 0).length,
    },
  };
}
