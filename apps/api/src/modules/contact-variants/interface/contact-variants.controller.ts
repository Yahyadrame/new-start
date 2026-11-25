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
import { ContactVariant } from '@newstart/shared';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { ContactVariantsService } from '../application/contact-variants.js';

@Controller('me/contact-variants')
@UseGuards(AccessGuard)
export class ContactVariantsController {
  constructor(@Inject(ContactVariantsService) private readonly variants: ContactVariantsService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.variants.list(userId);
  }

  @Put(':slug')
  set(@CurrentUserId() userId: string, @Param('slug') slug: string, @Body() body: unknown) {
    return this.variants.set(userId, slug, parseBody(ContactVariant, body));
  }

  @Delete(':slug')
  @HttpCode(204)
  async clear(@CurrentUserId() userId: string, @Param('slug') slug: string) {
    await this.variants.clear(userId, slug);
  }
}
