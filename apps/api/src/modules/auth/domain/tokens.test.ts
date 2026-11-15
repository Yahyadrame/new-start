import { generateKeyPairSync } from 'node:crypto';
import { jwtVerify } from 'jose';
import { describe, expect, it } from 'vitest';
import { createAccessSigner, hashRefreshToken, newRefreshToken } from './tokens.js';

describe('createAccessSigner', () => {
  it('signe un jeton ES256 de 15 minutes pour le compte', async () => {
    const signer = createAccessSigner();
    const { payload, protectedHeader } = await jwtVerify(
      await signer.sign('u-1'),
      signer.publicKey,
    );
    expect(protectedHeader.alg).toBe('ES256');
    expect(payload).toMatchObject({ sub: 'u-1', iss: 'new-start' });
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(900);
  });
  it('utilise la clé fournie, même avec des \\n écrits en clair', async () => {
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const pem = String(privateKey.export({ type: 'pkcs8', format: 'pem' }))
      .trim()
      .replace(/\n/g, '\\n');
    const signer = createAccessSigner(pem);
    await expect(jwtVerify(await signer.sign('u-2'), signer.publicKey)).resolves.toBeTruthy();
  });
  it('refuse un jeton signé par une autre clé', async () => {
    const [a, b] = [createAccessSigner(), createAccessSigner()];
    await expect(jwtVerify(await a.sign('u'), b.publicKey)).rejects.toThrow();
  });
});

describe('jeton de rafraîchissement', () => {
  it('est aléatoire, opaque et haché de façon stable', () => {
    const [a, b] = [newRefreshToken(), newRefreshToken()];
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[\w-]{43}$/);
    expect(hashRefreshToken(a)).toBe(hashRefreshToken(a));
    expect(hashRefreshToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashRefreshToken(a)).not.toContain(a);
  });
});
