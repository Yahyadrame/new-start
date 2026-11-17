import fr from '../../shared/i18n/fr.json';
import { LevelTest } from './level-test';

/** Étape 3 de l'inscription : le test de niveau. */
export function LevelScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 pt-8 pb-6">
      <div role="img" aria-label={fr.level.stepLabel} className="flex gap-1.5">
        <span className="h-1 flex-1 rounded-full bg-accent" />
        <span className="h-1 flex-1 rounded-full bg-accent" />
        <span className="h-1 flex-1 rounded-full bg-accent" />
      </div>
      <LevelTest />
    </main>
  );
}
