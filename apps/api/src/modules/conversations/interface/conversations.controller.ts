import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { StartConversation } from '@newstart/shared';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { ConversationsService } from '../application/conversations.js';

@Controller('conversations')
@UseGuards(AccessGuard)
export class ConversationsController {
  constructor(@Inject(ConversationsService) private readonly conversations: ConversationsService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.conversations.list(userId);
  }

  @Post()
  start(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.conversations.start(userId, parseBody(StartConversation, body).agentSlug);
  }
}
