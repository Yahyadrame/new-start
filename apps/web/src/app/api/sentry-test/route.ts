import { timingSafeEqual } from 'node:crypto';

export const dynamic = 'force-dynamic';

// Erreur volontaire pour vérifier que Sentry reçoit les erreurs serveur de Next.js.
// 404 sans jeton configuré ou avec un mauvais jeton.
export function GET(request: Request): Response {
  const expected = process.env['SENTRY_TEST_TOKEN'] ?? '';
  const a = Buffer.from(request.headers.get('x-sentry-test-token') ?? '');
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    return new Response(null, { status: 404 });
  }
  throw new Error('Test Sentry volontaire (NS-026)');
}
