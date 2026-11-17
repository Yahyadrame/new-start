import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createAccessSigner } from '../domain/tokens.js';
import { AccessGuard, type AuthedRequest } from './access.guard.js';

function context(authorization?: string) {
  const req: AuthedRequest = { headers: authorization ? { authorization } : {} };
  const ctx = { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
  return { req, ctx };
}

describe('AccessGuard', () => {
  const signer = createAccessSigner();
  const guard = new AccessGuard(signer);

  it('laisse passer un jeton valide et pose l’identifiant sur la requête', async () => {
    const { req, ctx } = context(`Bearer ${await signer.sign('u-1')}`);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.userId).toBe('u-1');
  });

  it.each([
    ['sans en-tête', undefined],
    ['sans le mot Bearer', 'abc'],
    ['avec un jeton faux', 'Bearer abc'],
    ['avec un jeton vide', 'Bearer '],
  ])('répond 401 UNAUTHENTICATED %s', async (_nom, header) => {
    const { req, ctx } = context(header);
    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      status: 401,
      response: { code: 'UNAUTHENTICATED' },
    });
    expect(req.userId).toBeUndefined();
  });

  it('refuse un jeton signé par une autre clé', async () => {
    const other = createAccessSigner();
    const { ctx } = context(`Bearer ${await other.sign('u-2')}`);
    await expect(guard.canActivate(ctx)).rejects.toMatchObject({ status: 401 });
  });
});
