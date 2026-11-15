import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { z } from 'zod';

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
  goal: z.enum(['SCHOLARSHIP', 'WORK', 'TRAVEL', 'FRIENDS']),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()),
  acceptTerms: z.literal(true),
  smsOptIn: z.boolean().default(false),
  voiceConsent: z.boolean().default(false),
});
export type SignupProfile = z.infer<typeof SignupProfile>;
