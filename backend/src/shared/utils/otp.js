import { randomInt } from 'crypto';

/** Kode OTP 6 digit numerik. */
export const generateOtp = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
