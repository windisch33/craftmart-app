import dotenv from 'dotenv';

dotenv.config();

import os from 'os';
import path from 'path';

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  UPLOAD_PATH: string;
  PDF_CACHE_DIR: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW_MS: number;
}

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const config: EnvConfig = {
  PORT: parseNumber(process.env.PORT, 3001),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: parseNumber(process.env.DB_PORT, 5432),
  DB_NAME: process.env.DB_NAME ?? 'craftmart',
  DB_USER: process.env.DB_USER ?? 'craftmart_user',
  DB_PASSWORD: process.env.DB_PASSWORD ?? 'password',
  JWT_SECRET: process.env.JWT_SECRET ?? 'your-secret-key',
  UPLOAD_PATH: process.env.UPLOAD_PATH ?? './uploads',
  PDF_CACHE_DIR: process.env.PDF_CACHE_DIR ?? path.join(os.tmpdir(), 'craftmart-pdf-cache'),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  RATE_LIMIT_MAX: parseNumber(process.env.RATE_LIMIT_MAX, 5),
  RATE_LIMIT_WINDOW_MS: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000)
};
