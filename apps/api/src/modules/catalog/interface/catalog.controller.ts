import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { AgentsQuery } from '@newstart/shared';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { CatalogService } from '../application/catalog.js';

@Controller()
@UseGuards(AccessGuard)
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalog: CatalogService) {}

  @Get('topics')
  topics(@CurrentUserId() userId: string) {
    return this.catalog.topics(userId);
  }

  @Get('agents')
  agents(@CurrentUserId() userId: string, @Query() query: unknown) {
    return this.catalog.agents(userId, parseBody(AgentsQuery, query));
  }
}
