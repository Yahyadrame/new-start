import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { AddNotebookEntry } from '@newstart/shared';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { NotebookService } from '../application/notebook.js';

@Controller('notebook')
@UseGuards(AccessGuard)
export class NotebookController {
  constructor(@Inject(NotebookService) private readonly notebook: NotebookService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.notebook.list(userId);
  }

  /** Garder la même correction deux fois rend la même entrée. */
  @Post()
  add(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.notebook.add(userId, parseBody(AddNotebookEntry, body).messageId);
  }
}
