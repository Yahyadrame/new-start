import { generateKeyPairSync } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';
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

describe('AccessSigner.verify', () => {
  it('rend l’identifiant du compte pour un jeton valide', async () => {
    const signer = createAccessSigner();
    await expect(signer.verify(await signer.sign('u-1'))).resolves.toBe('u-1');
  });
  it('rend null pour un jeton signé par une autre clé, du texte libre ou un jeton vide', async () => {
    const [a, b] = [createAccessSigner(), createAccessSigner()];
    await expect(b.verify(await a.sign('u'))).resolves.toBeNull();
    await expect(a.verify('pas-un-jeton')).resolves.toBeNull();
    await expect(a.verify('')).resolves.toBeNull();
  });
  it('rend null pour un jeton expiré ou d’un autre émetteur', async () => {
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const pem = String(privateKey.export({ type: 'pkcs8', format: 'pem' }));
    const signer = createAccessSigner(pem);
    const make = (iss: string, exp: string) =>
      new SignJWT({})
        .setProtectedHeader({ alg: 'ES256' })
        .setSubject('u')
        .setIssuer(iss)
        .setIssuedAt()
        .setExpirationTime(exp)
        .sign(privateKey);
    await expect(signer.verify(await make('new-start', '10 minutes'))).resolves.toBe('u');
    await expect(signer.verify(await make('autre', '10 minutes'))).resolves.toBeNull();
    await expect(signer.verify(await make('new-start', '-1 minutes'))).resolves.toBeNull();
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
