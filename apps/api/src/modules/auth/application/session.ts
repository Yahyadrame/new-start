import { HttpException } from '@nestjs/common';
import {
  ACCESS_TTL_SECONDS,
  hashRefreshToken,
  newRefreshToken,
  REFRESH_TTL_MS,
  type AccessSigner,
} from '../domain/tokens.js';
import type { Session, UserSummary } from './verify-otp.js';

export const SESSION_STORE = Symbol('SESSION_STORE');

export type StoredToken = {
  id: string;
  userId: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

/** Port de stockage des jetons de rafraîchissement. */
export interface SessionStore {
  findToken(tokenHash: string): Promise<StoredToken | null>;
  /** Révoque le jeton ; faux si un autre appel l'avait déjà révoqué. */
  revokeToken(id: string): Promise<boolean>;
  revokeFamily(familyId: string): Promise<void>;
  addToken(row: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<void>;
  findUserById(id: string): Promise<UserSummary | null>;
}

const unauthorized = () =>
  new HttpException(
    { code: 'INVALID_REFRESH_TOKEN', message: 'Ta session a expiré. Reconnecte-toi.' },
    401,
  );

export class SessionService {
  constructor(
    private readonly store: SessionStore,
    private readonly signer: AccessSigner,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Rotation : l'ancien jeton est révoqué, un nouveau prend sa place dans la même famille. */
  async refresh(token: string): Promise<Session> {
    const now = this.now();
    const stored = await this.store.findToken(hashRefreshToken(token));
    if (!stored) throw unauthorized();
    // Jeton déjà utilisé : il a sans doute été copié. On coupe toute la famille.
    if (stored.revokedAt || !(await this.store.revokeToken(stored.id))) {
      await this.store.revokeFamily(stored.familyId);
      throw unauthorized();
    }
    const user = stored.expiresAt > now ? await this.store.findUserById(stored.userId) : null;
    if (!user) throw unauthorized();
    const refreshToken = newRefreshToken();
    await this.store.addToken({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      familyId: stored.familyId,
      expiresAt: new Date(now.getTime() + REFRESH_TTL_MS),
    });
    return {
      accessToken: await this.signer.sign(user.id),
      expiresInSeconds: ACCESS_TTL_SECONDS,
      refreshToken,
      user,
    };
  }

  /** Déconnexion : révoque toute la famille. Silencieuse si le jeton est inconnu. */
  async logout(token: string): Promise<void> {
    const stored = await this.store.findToken(hashRefreshToken(token));
    if (stored) await this.store.revokeFamily(stored.familyId);
  }
}
