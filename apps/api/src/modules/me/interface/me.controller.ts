import { Body, Controller, Get, Inject, Patch, UseGuards } from '@nestjs/common';
import { MePatch } from '@newstart/shared';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { MeService } from '../application/me.js';

@Controller('me')
@UseGuards(AccessGuard)
export class MeController {
  constructor(@Inject(MeService) private readonly me: MeService) {}

  @Get()
  get(@CurrentUserId() userId: string) {
    return this.me.get(userId);
  }

  @Patch()
  update(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.me.update(userId, parseBody(MePatch, body));
  }
}
