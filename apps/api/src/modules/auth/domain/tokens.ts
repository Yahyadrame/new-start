import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
  type KeyObject,
} from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ISSUER = 'new-start';

export type AccessSigner = {
  publicKey: KeyObject;
  sign(userId: string): Promise<string>;
  /** Renvoie l'identifiant du compte, ou null si le jeton est faux, expiré ou d'un autre émetteur. */
  verify(token: string): Promise<string | null>;
};

/** Jeton d'accès ES256. Sans clé fournie, on en tire une au démarrage (les jetons tombent au redémarrage). */
export function createAccessSigner(pem?: string): AccessSigner {
  // ponytail: clé éphémère sans JWT_PRIVATE_KEY ; la poser avant plusieurs réplicas (sinon chacun signe avec la sienne).
  const privateKey = pem
    ? createPrivateKey(pem.replace(/\\n/g, '\n'))
    : generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey;
  const publicKey = createPublicKey(privateKey);
  return {
    publicKey,
    sign: (userId) =>
      new SignJWT({})
        .setProtectedHeader({ alg: 'ES256' })
        .setSubject(userId)
        .setIssuer(ISSUER)
        .setIssuedAt()
        .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
        .sign(privateKey),
    verify: async (token) => {
      try {
        const { payload } = await jwtVerify(token, publicKey, {
          issuer: ISSUER,
          algorithms: ['ES256'],
        });
        return payload.sub ?? null;
      } catch {
        return null;
      }
    },
  };
}

/** Jeton de rafraîchissement opaque : 32 octets aléatoires, seul le SHA-256 va en base. */
export const newRefreshToken = () => randomBytes(32).toString('base64url');
export const hashRefreshToken = (token: string) => createHash('sha256').update(token).digest('hex');
