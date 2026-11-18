import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LevelAnswerBody } from '@newstart/shared';
import { z } from 'zod';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { LevelTest } from '../application/level-test.js';
import { Voice } from '../application/voice.js';

const VoiceConsentBody = z.object({ accepted: z.boolean() });

@Controller('onboarding')
@UseGuards(AccessGuard)
export class OnboardingController {
  constructor(
    @Inject(LevelTest) private readonly levelTest: LevelTest,
    @Inject(Voice) private readonly voice: Voice,
  ) {}

  @Post('level-test/answer')
  @HttpCode(200)
  answer(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.levelTest.answer(userId, parseBody(LevelAnswerBody, body));
  }

  @Post('level-test/transcribe')
  @HttpCode(200)
  transcribe(
    @CurrentUserId() userId: string,
    @Headers('content-type') type: string | undefined,
    @Body() body: unknown,
  ) {
    // Le corps est un Buffer seulement pour un `Content-Type: audio/*` ; sinon il est vide ou du JSON.
    const audio = Buffer.isBuffer(body) ? body : new Uint8Array(0);
    return this.voice.transcribe(userId, audio, (type ?? '').split(';')[0] ?? '');
  }

  @Get('voice-consent')
  consent(@CurrentUserId() userId: string) {
    return this.voice.consent(userId);
  }

  @Put('voice-consent')
  @HttpCode(204)
  async setConsent(@CurrentUserId() userId: string, @Body() body: unknown) {
    await this.voice.setConsent(userId, parseBody(VoiceConsentBody, body).accepted);
  }
}
