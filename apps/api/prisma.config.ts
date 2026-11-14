import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { seed: 'tsx src/seed/run.ts' },
  datasource: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://newstart:change-me@localhost:5432/newstart',
  },
});
