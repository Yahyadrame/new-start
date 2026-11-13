import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  /** Le processus répond. Ne touche jamais la base (la sonde d'éveil l'appelle toutes les quelques minutes). */
  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
