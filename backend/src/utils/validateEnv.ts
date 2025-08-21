import { config } from '../config/env';

/**
 * Validates required environment variables and configuration
 */
export function validateEnvironment(): void {
  const errors: string[] = [];

  // Check if JWT_SECRET is using the default value in production
  if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'your-secret-key') {
    errors.push('JWT_SECRET must be set to a secure value in production');
  }

  // Validate JWT_SECRET length (more strict in production)
  if (config.NODE_ENV === 'production' && config.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long in production');
  } else if (config.NODE_ENV !== 'production' && config.JWT_SECRET.length < 10) {
    console.warn('Warning: JWT_SECRET is quite short for development. Consider using a longer key.');
  }

  // Validate database configuration
  if (!config.DB_HOST || !config.DB_NAME || !config.DB_USER || !config.DB_PASSWORD) {
    errors.push('Database configuration is incomplete. DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD are required');
  }

  // Validate CORS origin in production
  if (config.NODE_ENV === 'production' && config.CORS_ORIGIN === 'http://localhost:3000') {
    console.warn('Warning: CORS_ORIGIN is set to localhost in production. Consider setting it to your production domain.');
  }

  // Validate rate limiting configuration
  if (config.RATE_LIMIT_MAX < 1 || config.RATE_LIMIT_MAX > 100) {
    errors.push('RATE_LIMIT_MAX should be between 1 and 100');
  }

  if (config.RATE_LIMIT_WINDOW_MS < 60000) { // Less than 1 minute
    errors.push('RATE_LIMIT_WINDOW_MS should be at least 60000ms (1 minute)');
  }

  // Log configuration status
  console.log('Environment Configuration:');
  console.log(`- NODE_ENV: ${config.NODE_ENV}`);
  console.log(`- PORT: ${config.PORT}`);
  console.log(`- DB_HOST: ${config.DB_HOST}`);
  console.log(`- CORS_ORIGIN: ${config.CORS_ORIGIN}`);
  console.log(`- Rate Limit: ${config.RATE_LIMIT_MAX} attempts per ${config.RATE_LIMIT_WINDOW_MS}ms`);

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('✓ Environment validation passed');
}