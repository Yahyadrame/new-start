import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EditMessage } from '@newstart/shared';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { ConversationsService } from '../application/conversations.js';
import { TranslationService } from '../application/translation.js';

@Controller('messages')
@UseGuards(AccessGuard)
export class MessagesController {
  constructor(
    @Inject(TranslationService) private readonly translation: TranslationService,
    @Inject(ConversationsService) private readonly conversations: ConversationsService,
  ) {}

  /** Efface le texte d'un message ; 204, ou 404 s'il n'existe pas ou n'est pas à la personne. */
  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    await this.conversations.remove(userId, id);
  }

  /** Remplace le texte d'un message de la personne ; sa correction est refaite. 404 s'il n'existe pas ou n'est pas le sien. */
  @Patch(':id')
  edit(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: unknown) {
    return this.conversations.edit(userId, id, parseBody(EditMessage, body).text);
  }

  /** Traduction française d'un message d'agent ; 200 aussi pour une traduction déjà gardée. */
  @Post(':id/translate')
  @HttpCode(200)
  translate(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.translation.translate(userId, id);
  }
}
