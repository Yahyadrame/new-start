import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { PlansQuery } from '@newstart/shared';
import { AccessGuard } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { PlansService } from '../application/plans.js';

@Controller('plans')
@UseGuards(AccessGuard)
export class PlansController {
  constructor(@Inject(PlansService) private readonly plans: PlansService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.plans.list(parseBody(PlansQuery, query).country);
  }
}
