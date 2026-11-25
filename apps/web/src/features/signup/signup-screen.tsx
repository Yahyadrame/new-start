import { SignupForm } from './signup-form';

/** Écran 11 des maquettes, en quatre étapes : identité, objectifs, centres d'intérêt, consentements. */
export function SignupScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 pt-8 pb-9">
      <SignupForm />
    </main>
  );
}
