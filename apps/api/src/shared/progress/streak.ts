import type { PrismaService } from '../prisma/prisma.service.js';

interface StreakState {
  streakDays: number;
  /** Dernier jour d'activité, au format AAAA-MM-JJ. */
  lastActiveDay: string | null;
  paused: boolean;
}

/** Le jour (AAAA-MM-JJ) de `now` dans le fuseau de la personne. */
export const localDay = (now: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone }).format(now);

const dayBefore = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000);

/**
 * Série de jours après une activité le jour `today` :
 * déjà comptée aujourd'hui = inchangée, hier = +1, plus ancien = repart à 1.
 * En mode pause la série est gelée : le jour est noté, elle ne bouge pas.
 */
export function nextStreak(state: StreakState, today: string): number {
  if (state.lastActiveDay === today) return state.streakDays;
  if (state.paused) return state.streakDays;
  const yesterday = dayBefore(today).toISOString().slice(0, 10);
  return state.lastActiveDay === yesterday ? state.streakDays + 1 : 1;
}

/**
 * Les champs `User` à écrire avec l'XP gagné : série et dernier jour d'activité.
 * Rend `{}` pour un compte inconnu ; à utiliser dans le même `update` que l'incrément d'XP.
 */
export async function streakUpdate(
  db: Pick<PrismaService, 'user'>,
  userId: string,
  now: Date = new Date(),
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { streakDays: true, lastActiveDay: true, timezone: true, pausedUntil: true },
  });
  if (!user) return {};
  const today = localDay(now, user.timezone);
  const streakDays = nextStreak(
    {
      streakDays: user.streakDays,
      lastActiveDay: user.lastActiveDay?.toISOString().slice(0, 10) ?? null,
      paused: user.pausedUntil !== null && user.pausedUntil > now,
    },
    today,
  );
  return { streakDays, lastActiveDay: new Date(`${today}T00:00:00Z`) };
}
