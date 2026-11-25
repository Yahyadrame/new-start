import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AvatarChoice } from '@newstart/shared';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { ContactAvatarsService } from '../application/contact-avatars.js';

@Controller('me/contact-avatars')
@UseGuards(AccessGuard)
export class ContactAvatarsController {
  constructor(@Inject(ContactAvatarsService) private readonly avatars: ContactAvatarsService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.avatars.list(userId);
  }

  @Put(':slug')
  set(@CurrentUserId() userId: string, @Param('slug') slug: string, @Body() body: unknown) {
    return this.avatars.set(userId, slug, parseBody(AvatarChoice, body));
  }

  @Delete(':slug')
  @HttpCode(204)
  async clear(@CurrentUserId() userId: string, @Param('slug') slug: string) {
    await this.avatars.clear(userId, slug);
  }
}
