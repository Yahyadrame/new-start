import { createHmac, randomInt } from 'node:crypto';

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RATE_WINDOW_MS = 10 * 60 * 1000;
export const OTP_RATE_LIMIT = 3;

export type OtpChannel = 'email' | 'sms';

/** Code à 6 chiffres, tiré avec un générateur cryptographique. */
export const generateCode = (): string => String(randomInt(0, 1_000_000)).padStart(6, '0');

/** HMAC avec une clé du serveur : un code à 6 chiffres haché seul se retrouve en un instant. */
export const hashCode = (key: string, destination: string, code: string): string =>
  createHmac('sha256', key).update(`${destination}:${code}`).digest('hex');
