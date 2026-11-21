import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GameResult } from '@newstart/shared';
import { z } from 'zod';
import { AccessGuard, CurrentUserId } from '../../../shared/auth/access.guard.js';
import { parseBody } from '../../../shared/http/validate.js';
import { GAME_TYPES, GamesService } from '../application/games.js';

const Params = z.object({
  type: z.enum(GAME_TYPES as [string, ...string[]]),
  count: z.coerce.number().int().min(1).max(20).default(10),
});

@Controller('games')
@UseGuards(AccessGuard)
export class GamesController {
  constructor(@Inject(GamesService) private readonly games: GamesService) {}

  /** Questions sans état : la réponse est dans la question, pour répondre sans attendre le réseau. */
  @Get(':type/questions')
  questions(@Param('type') type: string, @Query('count') count?: string) {
    const p = parseBody(Params, { type, ...(count !== undefined && { count }) });
    return this.games.questions(p.type as (typeof GAME_TYPES)[number], p.count);
  }

  /** Fin de partie : l'XP gagné. Les points sont déclarés par l'écran (pas de classement fiable). */
  @Post('results')
  @HttpCode(200)
  results(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.games.finish(userId, parseBody(GameResult, body).correct);
  }
}
