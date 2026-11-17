import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from './app.module.js';
import { PrismaService } from './shared/prisma/prisma.service.js';

// Démarre tout le graphe d'injection (garde, IA, modules) sans base de données.
const db = { levelTestAnswer: { upsert: vi.fn() }, $connect: vi.fn(), onModuleInit: vi.fn() };
let app: Awaited<ReturnType<typeof boot>>;
async function boot() {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(db)
    .compile();
  const nest = module.createNestApplication();
  await nest.init();
  return nest;
}
beforeAll(async () => {
  process.env.DATABASE_URL = 'postgresql://x:x@localhost:5432/x';
  app = await boot();
});
afterAll(() => app.close());

describe('AppModule', () => {
  it('protège le test de niveau : sans jeton, 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/onboarding/level-test/answer')
      .send({ position: 1, text: 'hi' });
    expect(res.status).toBe(401);
    expect(db.levelTestAnswer.upsert).not.toHaveBeenCalled();
  });
});
