import { z } from 'zod';

export const CONTACT_TONES = ['familier', 'neutre', 'soigne'] as const;
export const CONTACT_DIFFICULTIES = ['A2', 'B1', 'B2', 'C1'] as const;

/** Réglages d'une personne pour un contact : le ton et la difficulté qui remplacent ceux d'origine. */
export const ContactVariant = z
  .strictObject({
    tone: z.enum(CONTACT_TONES).optional(),
    difficulty: z.enum(CONTACT_DIFFICULTIES).optional(),
  })
  .refine((v) => v.tone !== undefined || v.difficulty !== undefined, 'Aucun réglage choisi.');
export type ContactVariant = z.infer<typeof ContactVariant>;

/** Les réglages d'une personne, par identifiant de contact (`jade`). */
export const ContactVariants = z.record(z.string(), ContactVariant);
export type ContactVariants = z.infer<typeof ContactVariants>;
