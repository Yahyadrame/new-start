import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { CheckReadiness } from '../application/check-readiness.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(CheckReadiness) private readonly readiness: CheckReadiness) {}

  /** Le processus répond. Ne touche jamais la base (la sonde d'éveil l'appelle toutes les quelques minutes). */
  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /** Les dépendances répondent : base, et Redis seulement s'il est configuré. */
  @Get('ready')
  async ready(): Promise<{ status: 'ok'; checks: Record<string, 'up' | 'down'> }> {
    const { ready, checks } = await this.readiness.execute();
    if (!ready) {
      throw new ServiceUnavailableException({
        code: 'NOT_READY',
        message: "Le service n'est pas prêt.",
        details: { checks },
      });
    }
    return { status: 'ok', checks };
  }
}
