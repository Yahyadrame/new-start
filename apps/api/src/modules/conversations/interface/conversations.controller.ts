import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  MediaQuery,
  MessagesQuery,
  SearchQuery,
  SendMessage,
  StartConversation,
} from '@newstart/shared';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { ConversationsService } from '../application/conversations.js';
import { MediaSend } from '../application/media-send.js';

type StatusResponse = { status(code: number): unknown };

@Controller('conversations')
@UseGuards(AccessGuard)
export class ConversationsController {
  constructor(
    @Inject(ConversationsService) private readonly conversations: ConversationsService,
    @Inject(MediaSend) private readonly media: MediaSend,
  ) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.conversations.list(userId);
  }

  /** Déclarée avant `:id/...` : « search » n'est jamais pris pour un identifiant. */
  @Get('search')
  search(@CurrentUserId() userId: string, @Query() query: unknown) {
    return this.conversations.search(userId, parseBody(SearchQuery, query).q);
  }

  @Post()
  start(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.conversations.start(userId, parseBody(StartConversation, body).agentSlug);
  }

  @Get(':id/messages')
  messages(@CurrentUserId() userId: string, @Param('id') id: string, @Query() query: unknown) {
    return this.conversations.messages(userId, id, parseBody(MessagesQuery, query).cursor);
  }

  /** Ouvrir la conversation la marque lue ; sans corps, 204. */
  @Post(':id/read')
  @HttpCode(204)
  async read(@CurrentUserId() userId: string, @Param('id') id: string) {
    await this.conversations.markRead(userId, id);
  }

  /** 201 pour un nouveau message, 200 quand le `clientId` était déjà enregistré (renvoi). */
  @Post(':id/messages')
  async send(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() body: unknown,
    @Res({ passthrough: true }) res: StatusResponse,
  ) {
    const { message, created } = await this.conversations.send(
      userId,
      id,
      parseBody(SendMessage, body),
    );
    res.status(created ? 201 : 200);
    return message;
  }

  /** Photo ou vocal en octets bruts. 201 pour un nouveau message, 200 pour un renvoi. */
  @Post(':id/media')
  async sendMedia(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Query() query: unknown,
    @Body() body: unknown,
    @Res({ passthrough: true }) res: StatusResponse,
  ) {
    const { clientId, seconds } = parseBody(MediaQuery, query);
    // Sans `Content-Type: audio/*` ou `image/*`, le corps n'est pas lu en octets : il sera refusé.
    const data = Buffer.isBuffer(body) ? body : new Uint8Array(0);
    const { message, created } = await this.media.send(userId, id, { clientId, data, seconds });
    res.status(created ? 201 : 200);
    return message;
  }
}
