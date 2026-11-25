import { z } from 'zod';
import { SignupProfile, SIGNUP_GOALS, SIGNUP_INTERESTS } from './signup.js';

export const THEMES = ['SYSTEM', 'LIGHT', 'DARK'] as const;
export const ACCENTS = ['en-US', 'en-GB', 'en-NG'] as const;
/** Fonds de conversation proposés ; `NONE` (uni) est le choix par défaut. */
export const CHAT_BACKGROUNDS = [
  'NONE',
  'TINT',
  'DOTS',
  'GRID',
  'RULED',
  'DIAGONAL',
  'HONEYCOMB',
  'WAVES',
  'DIAMONDS',
  'CIRCLES',
] as const;
export type ChatBackground = (typeof CHAT_BACKGROUNDS)[number];
export const DAILY_GOAL_RANGE = { min: 5, max: 120 } as const;

const ReminderTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure au format HH:MM.');

/** Profil et réglages tels que `GET /me` les renvoie. */
export const Me = z.object({
  id: z.string(),
  firstName: z.string(),
  goal: z.enum(SIGNUP_GOALS),
  interests: z.array(z.enum(SIGNUP_INTERESTS)),
  level: z.string(),
  theme: z.enum(THEMES),
  reminderTime: ReminderTime.nullable(),
  timezone: z.string(),
  dailyGoalMin: z.number().int(),
  preferredAccent: z.enum(ACCENTS),
  dataSaver: z.boolean(),
  chatBackground: z.enum(CHAT_BACKGROUNDS),
  pausedUntil: z.string().nullable(),
});
export type Me = z.infer<typeof Me>;

/** Modification envoyée à `PATCH /me` : une ou plusieurs clés, pas d'autre. Le mode pause ne peut pas finir dans le passé. */
export const MePatch = z
  .strictObject({
    firstName: SignupProfile.shape.firstName,
    goal: z.enum(SIGNUP_GOALS),
    theme: z.enum(THEMES),
    reminderTime: ReminderTime.nullable(),
    dailyGoalMin: z.number().int().min(DAILY_GOAL_RANGE.min).max(DAILY_GOAL_RANGE.max),
    preferredAccent: z.enum(ACCENTS),
    dataSaver: z.boolean(),
    chatBackground: z.enum(CHAT_BACKGROUNDS),
    pausedUntil: z.iso
      .datetime()
      .refine((d) => new Date(d).getTime() > Date.now(), 'La pause doit finir plus tard.')
      .nullable(),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, 'Aucune modification.');
export type MePatch = z.infer<typeof MePatch>;
