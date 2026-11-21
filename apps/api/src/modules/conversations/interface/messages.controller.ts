import { Controller, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { TranslationService } from '../application/translation.js';

@Controller('messages')
@UseGuards(AccessGuard)
export class MessagesController {
  constructor(@Inject(TranslationService) private readonly translation: TranslationService) {}

  /** Traduction française d'un message d'agent ; 200 aussi pour une traduction déjà gardée. */
  @Post(':id/translate')
  @HttpCode(200)
  translate(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.translation.translate(userId, id);
  }
}
