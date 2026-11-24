import { Body, Controller, HttpCode, Inject, Post, UseGuards } from '@nestjs/common';
import { PushSubscriptionInput } from '@newstart/shared';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { PushSubscriptionsService } from '../application/push-subscriptions.js';

@Controller('push/subscriptions')
@UseGuards(AccessGuard)
export class PushSubscriptionsController {
  constructor(
    @Inject(PushSubscriptionsService) private readonly subscriptions: PushSubscriptionsService,
  ) {}

  /** Abonne l'appareil de la personne connectée ; renvoyer le même abonnement ne crée pas de doublon. */
  @Post()
  @HttpCode(204)
  async subscribe(@CurrentUserId() userId: string, @Body() body: unknown): Promise<void> {
    await this.subscriptions.subscribe(userId, parseBody(PushSubscriptionInput, body));
  }
}
