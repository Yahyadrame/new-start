import { Controller, Get, HttpCode, Inject, Post, UseGuards } from '@nestjs/common';
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

  /** Marque tout comme lu ; la personne ne voit que ses propres notifications. */
  @Post('read-all')
  @HttpCode(204)
  async readAll(@CurrentUserId() userId: string): Promise<void> {
    await this.notifications.markAllRead(userId);
  }
}
