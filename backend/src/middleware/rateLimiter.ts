import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

// Rate limiter for login attempts
export const loginRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  message: {
    error: 'Too many login attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in test environment or when explicitly disabled for testing
  skip: () => process.env.NODE_ENV === 'test'
    || config.NODE_ENV !== 'production'
    || process.env.DISABLE_LOGIN_RATE_LIMIT === 'true'
    || process.env.DISABLE_LOGIN_RATE_LIMIT === '1'
});

// General API rate limiter (optional for future use)
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
});
