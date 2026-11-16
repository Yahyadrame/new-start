import { SignupProfile } from '@newstart/shared';
import { z } from 'zod';

/** Le formulaire : le profil partagé avec l'API, plus l'e-mail où partira le code. */
export const SignupFormSchema = SignupProfile.extend({
  birthYear: z.coerce.number().pipe(SignupProfile.shape.birthYear),
  // Une case décochée donne `false` : le schéma partagé veut `true`, on le dit avec un message du formulaire.
  acceptTerms: z.boolean().refine(Boolean),
  email: z.string().trim().toLowerCase().pipe(z.email()),
});
export type SignupFormInput = z.input<typeof SignupFormSchema>;
export type SignupFormValues = z.output<typeof SignupFormSchema>;
