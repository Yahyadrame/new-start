import { Controller, Delete, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
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

  /** Traduction française d'un message d'agent ; 200 aussi pour une traduction déjà gardée. */
  @Post(':id/translate')
  @HttpCode(200)
  translate(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.translation.translate(userId, id);
  }
}
