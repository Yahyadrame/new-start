import { Body, Controller, HttpCode, HttpException, Inject, Post, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { parseBody } from '../../../shared/http/validate.js';
import { ENV, type Env } from '../../../config/env.js';
import { REFRESH_TTL_MS } from '../domain/tokens.js';
import { SessionService } from '../application/session.js';
import { VerifyOtp } from '../application/verify-otp.js';
import { GoogleSignIn } from '../application/google-sign-in.js';
import { RequestOtp } from '../application/request-otp.js';
import { PhoneE164, SignupProfile } from '@newstart/shared';

const Destination = z.discriminatedUnion('channel', [
  z.object({
    channel: z.literal('email'),
    destination: z.string().trim().toLowerCase().pipe(z.email()),
  }),
  z.object({ channel: z.literal('sms'), destination: PhoneE164 }),
]);
const RequestBody = z.intersection(Destination, z.object({ signup: SignupProfile.optional() }));

const VerifyBody = z.intersection(Destination, z.object({ code: z.string().regex(/^\d{6}$/) }));

const GoogleBody = z.object({
  idToken: z.string().min(20).max(4096),
  signup: SignupProfile.optional(),
});

// Réponse Express réduite à ce qu'on utilise (le paquet de types n'est pas installé).
type CookieResponse = {
  cookie(name: string, value: string, options: object): void;
  clearCookie(name: string, options: object): void;
};
type CookieRequest = { headers: { cookie?: string | undefined } };

export const REFRESH_COOKIE = 'ns_refresh';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(RequestOtp) private readonly requestOtp: RequestOtp,
    @Inject(VerifyOtp) private readonly verifyOtp: VerifyOtp,
    @Inject(GoogleSignIn) private readonly google: GoogleSignIn,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post('otp/request')
  @HttpCode(200)
  request(@Body() body: unknown) {
    return this.requestOtp.execute(parseBody(RequestBody, body));
  }

  @Post('otp/verify')
  @HttpCode(200)
  async verify(@Body() body: unknown, @Res({ passthrough: true }) res: CookieResponse) {
    const { refreshToken, ...session } = await this.verifyOtp.execute(parseBody(VerifyBody, body));
    this.setRefreshCookie(res, refreshToken);
    return session;
  }

  @Post('google')
  @HttpCode(200)
  async signInWithGoogle(@Body() body: unknown, @Res({ passthrough: true }) res: CookieResponse) {
    const { refreshToken, ...session } = await this.google.execute(parseBody(GoogleBody, body));
    this.setRefreshCookie(res, refreshToken);
    return session;
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: CookieRequest, @Res({ passthrough: true }) res: CookieResponse) {
    const token = readCookie(req.headers.cookie, REFRESH_COOKIE);
    if (!token)
      throw new HttpException(
        { code: 'INVALID_REFRESH_TOKEN', message: 'Ta session a expiré. Reconnecte-toi.' },
        401,
      );
    const { refreshToken, ...session } = await this.sessions.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return session;
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: CookieRequest, @Res({ passthrough: true }) res: CookieResponse) {
    const token = readCookie(req.headers.cookie, REFRESH_COOKIE);
    if (token) await this.sessions.logout(token);
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  private cookieOptions() {
    // Chemin du rewrite Next (/api/auth/* vers l'API) : décision du 2026-11-15.
    return {
      httpOnly: true,
      secure: this.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/api/auth',
    };
  }

  private setRefreshCookie(res: CookieResponse, token: string) {
    res.cookie(REFRESH_COOKIE, token, { ...this.cookieOptions(), maxAge: REFRESH_TTL_MS });
  }
}

/** Lit un cookie dans l'en-tête brut (pas besoin d'un analyseur pour un seul cookie). */
export function readCookie(header: string | undefined, name: string): string | undefined {
  for (const part of header?.split(';') ?? []) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return undefined;
}
