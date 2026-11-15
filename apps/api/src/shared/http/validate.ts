import { HttpException } from '@nestjs/common';
import type { z } from 'zod';

/** Valide un corps de requête avec Zod ; l'erreur suit le format `{ code, message, details }`. */
export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  throw new HttpException(
    {
      code: 'VALIDATION_FAILED',
      message: 'Les données envoyées ne sont pas valides.',
      details: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    },
    400,
  );
}
