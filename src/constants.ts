import { type CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { type SessionOptions } from 'express-session';

export const CORS_CONFIG: CorsOptions = {
  origin: [process.env.SITE_URL as string],
  methods: ['GET', 'POST'],
  credentials: true,
};

export const SESSION_CONFIG: SessionOptions = {
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  },
};

export const TOTP_CONFIG = {
  digits: 9,
  period: 120,
};

export const OTP_TTL = 60;
export const TOKEN_TTL = 60 * 60; // 60 minutes
