import { timingSafeEqual } from 'node:crypto';
import {
  Controller,
  Get,
  Headers,
  Inject,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ENV, type Env } from '../../../config/env.js';
import { CheckReadiness } from '../application/check-readiness.js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(CheckReadiness) private readonly readiness: CheckReadiness,
    @Inject(ENV) private readonly env: Pick<Env, 'SENTRY_TEST_TOKEN'>,
  ) {}

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

  /** Erreur volontaire pour vérifier Sentry. 404 sans jeton configuré ou avec un mauvais jeton. */
  @Get('sentry-test')
  sentryTest(@Headers('x-sentry-test-token') token?: string): never {
    const expected = this.env.SENTRY_TEST_TOKEN;
    const a = Buffer.from(token ?? '');
    const b = Buffer.from(expected ?? '');
    if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) throw new NotFoundException();
    throw new Error('Test Sentry volontaire (NS-023)');
  }
}
