import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { MessagesQuery, StartConversation } from '@newstart/shared';
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

  @Get(':id/messages')
  messages(@CurrentUserId() userId: string, @Param('id') id: string, @Query() query: unknown) {
    return this.conversations.messages(userId, id, parseBody(MessagesQuery, query).cursor);
  }
}
