import dotenv from 'dotenv';

dotenv.config();

import os from 'os';
import path from 'path';

export const config = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_NAME: process.env.DB_NAME || 'craftmart',
  DB_USER: process.env.DB_USER || 'craftmart_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  PDF_CACHE_DIR: process.env.PDF_CACHE_DIR || path.join(os.tmpdir(), 'craftmart-pdf-cache'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '5'),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') // 15 minutes
};