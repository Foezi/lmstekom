import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} wajib diset (.env)`);
  }
}

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  otpDevMode: process.env.OTP_DEV_MODE === 'true',
  otpTtlMinutes: parseInt(process.env.OTP_TTL_MINUTES || '10', 10),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  fonnteToken: process.env.FONNTE_TOKEN,
};
