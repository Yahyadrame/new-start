import { HttpException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { SignupProfile } from '@newstart/shared';
import type { AccessSigner } from '../domain/tokens.js';
import { issueSession, type AccountStore, type Session } from './verify-otp.js';

export type GoogleIdentity = { sub: string; email: string };
/** Rend l'identité contenue dans le jeton Google, ou null s'il est faux, expiré ou d'une autre application. */
export type GoogleVerifier = (idToken: string) => Promise<GoogleIdentity | null>;

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export function createGoogleVerifier(clientId: string): GoogleVerifier {
  return async (idToken) => {
    try {
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: clientId,
      });
      const { sub, email, email_verified } = payload as Record<string, unknown>;
      if (typeof sub !== 'string' || typeof email !== 'string' || email_verified !== true)
        return null;
      return { sub, email: email.toLowerCase() };
    } catch {
      return null;
    }
  };
}

const fail = (status: number, code: string, message: string) =>
  new HttpException({ code, message }, status);

/** Connexion par Google : compte déjà relié, ou même e-mail vérifié, ou création avec le profil d'inscription. */
export class GoogleSignIn {
  constructor(
    private readonly store: AccountStore,
    private readonly signer: AccessSigner,
    private readonly verifier: GoogleVerifier | null,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: { idToken: string; signup?: SignupProfile | undefined }): Promise<Session> {
    if (!this.verifier)
      throw fail(503, 'GOOGLE_UNAVAILABLE', "La connexion avec Google n'est pas disponible.");
    const who = await this.verifier(input.idToken);
    if (!who) throw fail(401, 'INVALID_GOOGLE_TOKEN', "Google n'a pas pu confirmer ton identité.");

    let user = await this.store.findUser('google', who.sub);
    if (!user) {
      user = await this.store.findUser('email', who.email);
      if (!user) {
        if (!input.signup)
          throw fail(404, 'ACCOUNT_NOT_FOUND', "Aucun compte avec cette adresse. Crée-le d'abord.");
        user = await this.store.createUser(input.signup, 'email', who.email);
        if (!user)
          throw fail(409, 'ACCOUNT_CONFLICT', 'Ce numéro ou cette adresse est déjà utilisé.');
      }
      await this.store.linkIdentity(user.id, 'google', who.sub);
    }
    return issueSession(this.store, this.signer, user, this.now());
  }
}
