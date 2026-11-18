import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { ConversationsService } from '../application/conversations.js';

@Controller('conversations')
@UseGuards(AccessGuard)
export class ConversationsController {
  constructor(@Inject(ConversationsService) private readonly conversations: ConversationsService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.conversations.list(userId);
  }
}
