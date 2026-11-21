import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { ProgressService } from '../application/progress.js';

@Controller('progress')
@UseGuards(AccessGuard)
export class ProgressController {
  constructor(@Inject(ProgressService) private readonly progress: ProgressService) {}

  /** Niveau et XP de la personne connectée. */
  @Get()
  summary(@CurrentUserId() userId: string) {
    return this.progress.summary(userId);
  }
}
