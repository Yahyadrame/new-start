import { SIGNUP_GOALS, SignupProfile } from '@newstart/shared';
import { z } from 'zod';

/** Le formulaire : le profil partagé avec l'API, plus l'e-mail où partira le code. */
export const SignupFormSchema = SignupProfile.extend({
  // Au moins un objectif ; le premier coché devient l'objectif principal (`goal`).
  goals: z.array(z.enum(SIGNUP_GOALS)).min(1).max(4),
  birthYear: z.coerce.number().pipe(SignupProfile.shape.birthYear),
  // Une case décochée donne `false` : le schéma partagé veut `true`, on le dit avec un message du formulaire.
  acceptTerms: z.boolean().refine(Boolean),
  email: z.string().trim().toLowerCase().pipe(z.email()),
});
export type SignupFormInput = z.input<typeof SignupFormSchema>;
export type SignupFormValues = z.output<typeof SignupFormSchema>;
