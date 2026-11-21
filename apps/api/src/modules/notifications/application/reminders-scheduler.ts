import { Logger } from '@nestjs/common';

const log = new Logger('RemindersScheduler');

/**
 * Lance `SendReminders` à intervalle fixe, dans l'API.
 * Deux instances qui tournent en même temps ne créent pas de doublon : la clé unique (personne, type, jour) l'interdit.
 * ponytail: minuteur dans le processus de l'API ; à passer dans le worker (NS-017) quand il aura sa file.
 */
export class RemindersScheduler {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly run: (now: Date) => Promise<number>,
    private readonly everySeconds: number,
  ) {}

  /** Sans effet quand l'intervalle est 0 (éteint) ou que le minuteur tourne déjà. */
  start(): void {
    if (this.everySeconds <= 0 || this.timer) return;
    this.timer = setInterval(() => void this.tick(), this.everySeconds * 1000);
    this.timer.unref();
  }

  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Une erreur n'arrête pas le minuteur : le passage suivant réessaie. */
  async tick(now = new Date()): Promise<void> {
    try {
      const sent = await this.run(now);
      if (sent > 0) log.log(`${sent} rappel(s) écrit(s)`);
    } catch (err) {
      log.error(`Rappels : échec (${err instanceof Error ? err.name : 'inconnu'})`);
    }
  }
}
