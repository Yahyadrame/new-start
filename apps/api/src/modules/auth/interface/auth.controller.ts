import { Body, Controller, HttpCode, Inject, Post, Res } from '@nestjs/common';
import { z } from 'zod';
import { parseBody } from '../../../shared/http/validate.js';
import { ENV, type Env } from '../../../config/env.js';
import { REFRESH_TTL_MS } from '../domain/tokens.js';
import { VerifyOtp } from '../application/verify-otp.js';
import { RequestOtp } from '../application/request-otp.js';
import { PhoneE164, SignupProfile } from '../domain/signup-profile.js';

const Destination = z.discriminatedUnion('channel', [
  z.object({
    channel: z.literal('email'),
    destination: z.string().trim().toLowerCase().pipe(z.email()),
  }),
  z.object({ channel: z.literal('sms'), destination: PhoneE164 }),
]);
const RequestBody = z.intersection(Destination, z.object({ signup: SignupProfile.optional() }));

const VerifyBody = z.intersection(Destination, z.object({ code: z.string().regex(/^\d{6}$/) }));

// Réponse Express réduite à ce qu'on utilise (le paquet de types n'est pas installé).
type CookieResponse = { cookie(name: string, value: string, options: object): void };

export const REFRESH_COOKIE = 'ns_refresh';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(RequestOtp) private readonly requestOtp: RequestOtp,
    @Inject(VerifyOtp) private readonly verifyOtp: VerifyOtp,
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
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
      maxAge: REFRESH_TTL_MS,
    });
    return session;
  }
}
