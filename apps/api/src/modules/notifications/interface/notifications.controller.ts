import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { NotificationsService } from '../application/notifications.js';

@Controller('notifications')
@UseGuards(AccessGuard)
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

  /** Les notifications de la personne connectée, les plus récentes d'abord. */
  @Get()
  list(@CurrentUserId() userId: string) {
    return this.notifications.list(userId);
  }
}
