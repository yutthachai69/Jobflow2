/**
 * Environment Variables Validation and Configuration
 * 
 * ใช้สำหรับ validate และ type-safe access ถึง environment variables
 */

// Required environment variables
const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const

// Optional environment variables (with defaults)
const optionalEnvVars = {
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
} as const

/**
 * Validate required environment variables
 * Call this function at application startup
 */
export function validateEnvVars() {
  const missing: string[] = []

  // Check required variables
  if (!requiredEnvVars.DATABASE_URL) {
    missing.push('DATABASE_URL')
  }

  // In production, check for additional required vars
  if (process.env.NODE_ENV === 'production') {
    if (!optionalEnvVars.BLOB_READ_WRITE_TOKEN) {
      console.warn('⚠️  WARNING: BLOB_READ_WRITE_TOKEN is not set. Image uploads may fail.')
    }
  }

  if (missing.length > 0) {
    const errorMessage = `❌ Missing required environment variables: ${missing.join(', ')}\n\n` +
      `Please check your .env file or environment configuration.\n` +
      `See .env.example for reference.`
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMessage)
    } else {
      console.error(errorMessage)
      console.warn('⚠️  Continuing in development mode, but some features may not work.')
    }
  }
}

/**
 * Get environment configuration with type safety
 */
export const env = {
  // Required
  DATABASE_URL: requiredEnvVars.DATABASE_URL!,
  NODE_ENV: requiredEnvVars.NODE_ENV as 'development' | 'production' | 'test',
  
  // Optional
  BLOB_READ_WRITE_TOKEN: optionalEnvVars.BLOB_READ_WRITE_TOKEN,
  SESSION_SECRET: optionalEnvVars.SESSION_SECRET,
  SENTRY_DSN: optionalEnvVars.SENTRY_DSN,
  NEXT_PUBLIC_GA_ID: optionalEnvVars.NEXT_PUBLIC_GA_ID,
  
  // Helpers
  isDevelopment: requiredEnvVars.NODE_ENV === 'development',
  isProduction: requiredEnvVars.NODE_ENV === 'production',
  isTest: requiredEnvVars.NODE_ENV === 'test',
} as const

// Note: validateEnvVars() should be called explicitly at application startup
// We don't validate on module load to avoid issues during build time

