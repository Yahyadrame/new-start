import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { z } from 'zod';
import { parseBody } from '../../../shared/http/validate.js';
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

@Controller('auth')
export class AuthController {
  constructor(@Inject(RequestOtp) private readonly requestOtp: RequestOtp) {}

  @Post('otp/request')
  @HttpCode(200)
  request(@Body() body: unknown) {
    return this.requestOtp.execute(parseBody(RequestBody, body));
  }
}
