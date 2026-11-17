import {
  createParamDecorator,
  HttpException,
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';

/** Ce que la garde attend de l'authentification : l'identifiant du compte, ou null si le jeton est faux. */
export const ACCESS_VERIFIER = Symbol('ACCESS_VERIFIER');
export type AccessVerifier = { verify(token: string): Promise<string | null> };

export type AuthedRequest = { headers: { authorization?: string | undefined }; userId?: string };

/** Protège une route : exige `Authorization: Bearer <jeton d'accès>` et pose `userId` sur la requête. */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(@Inject(ACCESS_VERIFIER) private readonly verifier: AccessVerifier) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    // Pas de branche sur l'en-tête : `verify` rend null pour un jeton vide ou faux.
    const token = /^Bearer (\S+)$/.exec(req.headers.authorization ?? '')?.[1] ?? '';
    const userId = await this.verifier.verify(token);
    if (!userId) {
      throw new HttpException(
        { code: 'UNAUTHENTICATED', message: 'Connecte-toi pour continuer.' },
        401,
      );
    }
    req.userId = userId;
    return true;
  }
}

/** Identifiant du compte connecté, à utiliser derrière `AccessGuard`. */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest<AuthedRequest>().userId ?? '',
);
