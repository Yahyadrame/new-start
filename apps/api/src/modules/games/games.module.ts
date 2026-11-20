import { Module } from '@nestjs/common';
import { GAMES_STORE, GamesService, type GamesStore } from './application/games.js';
import { PrismaGamesStore } from './infrastructure/prisma-games.store.js';
import { GamesController } from './interface/games.controller.js';

@Module({
  controllers: [GamesController],
  providers: [
    { provide: GAMES_STORE, useClass: PrismaGamesStore },
    {
      provide: GamesService,
      inject: [GAMES_STORE],
      useFactory: (store: GamesStore) => new GamesService(store),
    },
  ],
})
export class GamesModule {}
