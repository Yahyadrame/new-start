import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { z } from 'zod';

/** Objectifs proposés à l'inscription, dans l'ordre d'affichage (écran 11). */
export const SIGNUP_GOALS = [
  'SCHOLARSHIP',
  'WORK',
  'TRAVEL',
  'FRIENDS',
  'STUDIES',
  'EXAMS',
  'BUSINESS',
  'CULTURE',
] as const;
export type SignupGoal = (typeof SIGNUP_GOALS)[number];

/** Centres d'intérêt à cocher à l'inscription : ils orienteront les contacts et les sujets proposés. */
export const SIGNUP_INTERESTS = [
  'MUSIC',
  'FOOTBALL',
  'SPORT',
  'MOVIES',
  'GAMING',
  'TECH',
  'BUSINESS',
  'HEALTH',
  'COOKING',
  'TRAVEL',
  'FASHION',
  'ART',
  'SCIENCE',
  'FAITH',
  'NATURE',
  'BOOKS',
] as const;
export type SignupInterest = (typeof SIGNUP_INTERESTS)[number];

/** Numéro validé et ramené au format E.164 ; sans indicatif, on suppose le Sénégal (+221). */
export const PhoneE164 = z.string().transform((value, ctx) => {
  const phone = parsePhoneNumberFromString(value, 'SN');
  if (!phone?.isValid()) {
    ctx.addIssue({ code: 'custom', message: "Ce numéro n'est pas valide." });
    return z.NEVER;
  }
  return phone.number;
});

/** Profil envoyé avec la demande de code ; le compte n'est créé qu'à la vérification. */
export const SignupProfile = z.strictObject({
  firstName: z.string().trim().min(2).max(30),
  phone: PhoneE164,
  /** Objectif principal : le premier de `goals` quand la personne en coche plusieurs. */
  goal: z.enum(SIGNUP_GOALS),
  goals: z.array(z.enum(SIGNUP_GOALS)).max(4).default([]),
  interests: z.array(z.enum(SIGNUP_INTERESTS)).max(8).default([]),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()),
  acceptTerms: z.literal(true),
  smsOptIn: z.boolean().default(false),
  voiceConsent: z.boolean().default(false),
});
export type SignupProfile = z.infer<typeof SignupProfile>;
