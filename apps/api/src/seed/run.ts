import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { parseEnv } from '../config/env.js';
import { seedNoyau } from './noyau.js';

const read = (name: string) =>
  readFileSync(new URL(`../../../../data/${name}`, import.meta.url), 'utf8');
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: parseEnv(process.env).DATABASE_URL }),
});
try {
  const n = await seedNoyau(db, { mots: read('mots.csv'), expressions: read('expressions.csv') });
  console.log(`Noyau chargé : ${n.words} mots, ${n.expressions} expressions`);
} finally {
  await db.$disconnect();
}
