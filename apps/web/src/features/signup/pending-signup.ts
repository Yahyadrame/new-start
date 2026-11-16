import { SignupFormSchema, type SignupFormValues } from './signup-schema';

const KEY = 'ns_pending_signup';

/** Garde le profil le temps de la vérification (onglet seulement, jamais dans l'URL). */
export function savePendingSignup(values: SignupFormValues) {
  sessionStorage.setItem(KEY, JSON.stringify(values));
}

export function loadPendingSignup(): SignupFormValues | null {
  try {
    const parsed = SignupFormSchema.safeParse(JSON.parse(sessionStorage.getItem(KEY) ?? 'null'));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const clearPendingSignup = () => sessionStorage.removeItem(KEY);
