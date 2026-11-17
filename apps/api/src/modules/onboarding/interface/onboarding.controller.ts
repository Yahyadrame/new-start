import { Body, Controller, HttpCode, Inject, Post, UseGuards } from '@nestjs/common';
import { LevelAnswerBody } from '@newstart/shared';
import { parseBody } from '../../../shared/http/validate.js';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { LevelTest } from '../application/level-test.js';

@Controller('onboarding')
@UseGuards(AccessGuard)
export class OnboardingController {
  constructor(@Inject(LevelTest) private readonly levelTest: LevelTest) {}

  @Post('level-test/answer')
  @HttpCode(200)
  answer(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.levelTest.answer(userId, parseBody(LevelAnswerBody, body));
  }
}
