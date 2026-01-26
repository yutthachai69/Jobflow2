/**
 * Security utilities for rate limiting, logging, and incident response
 */

// In-memory store for rate limiting (in production, use Redis or database)
const loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }>()

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5, // Maximum failed login attempts
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  WINDOW_DURATION: 60 * 60 * 1000, // 1 hour window for rate limiting
}

/**
 * Check if IP/username is rate limited
 * @param identifier - Username or IP address
 * @param useIP - If true, also check IP-based rate limiting
 */
export function checkRateLimit(
  identifier: string, 
  ipAddress?: string
): { allowed: boolean; remainingAttempts?: number; lockoutUntil?: Date } {
  // Check username-based rate limit
  const record = loginAttempts.get(identifier)
  
  if (!record) {
    // Also check IP-based rate limit if IP is provided
    if (ipAddress) {
      const ipRecord = loginAttempts.get(`ip:${ipAddress}`)
      if (ipRecord && ipRecord.count >= RATE_LIMIT_CONFIG.MAX_LOGIN_ATTEMPTS) {
        if (ipRecord.lockedUntil && ipRecord.lockedUntil > new Date()) {
          return { 
            allowed: false, 
            lockoutUntil: ipRecord.lockedUntil 
          }
        }
      }
    }
    return { allowed: true }
  }

  // Check if account is locked
  if (record.lockedUntil && record.lockedUntil > new Date()) {
    return { 
      allowed: false, 
      lockoutUntil: record.lockedUntil 
    }
  }

  // Reset if lockout period has passed
  if (record.lockedUntil && record.lockedUntil <= new Date()) {
    loginAttempts.delete(identifier)
    return { allowed: true }
  }

  // Check if too many attempts in time window
  const timeSinceFirstAttempt = Date.now() - record.lastAttempt.getTime()
  if (record.count >= RATE_LIMIT_CONFIG.MAX_LOGIN_ATTEMPTS) {
    // Lock the account
    const lockoutUntil = new Date(Date.now() + RATE_LIMIT_CONFIG.LOCKOUT_DURATION)
    record.lockedUntil = lockoutUntil
    loginAttempts.set(identifier, record)
    
    // Log security event
    logSecurityEvent('ACCOUNT_LOCKED', { identifier, lockoutUntil })
    
    return { 
      allowed: false, 
      lockoutUntil 
    }
  }

  return { 
    allowed: true, 
    remainingAttempts: RATE_LIMIT_CONFIG.MAX_LOGIN_ATTEMPTS - record.count 
  }
}

/**
 * Record a failed login attempt
 * @param identifier - Username
 * @param ipAddress - IP address (optional, for IP-based rate limiting)
 */
export function recordFailedLogin(identifier: string, ipAddress?: string) {
  // Record username-based attempt
  const record = loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() }
  record.count += 1
  record.lastAttempt = new Date()
  loginAttempts.set(identifier, record)
  
  // Also record IP-based attempt if IP is provided
  if (ipAddress) {
    const ipKey = `ip:${ipAddress}`
    const ipRecord = loginAttempts.get(ipKey) || { count: 0, lastAttempt: new Date() }
    ipRecord.count += 1
    ipRecord.lastAttempt = new Date()
    loginAttempts.set(ipKey, ipRecord)
  }
  
  // Log security event
  logSecurityEvent('FAILED_LOGIN', { identifier, ipAddress, attemptCount: record.count })
  
  // Clean up old records (older than 24 hours)
  cleanupOldRecords()
}

/**
 * Clear failed login attempts (on successful login)
 * @param identifier - Username
 * @param ipAddress - IP address (optional, to clear IP-based rate limiting)
 */
export function clearFailedLogin(identifier: string, ipAddress?: string) {
  loginAttempts.delete(identifier)
  
  // Also clear IP-based rate limit if IP is provided
  if (ipAddress) {
    loginAttempts.delete(`ip:${ipAddress}`)
  }
}

/**
 * Clean up old rate limit records
 */
function cleanupOldRecords() {
  const now = Date.now()
  for (const [key, record] of loginAttempts.entries()) {
    if (now - record.lastAttempt.getTime() > 24 * 60 * 60 * 1000) { // 24 hours
      loginAttempts.delete(key)
    }
  }
}

/**
 * Security event logging
 * Now records to database as SecurityIncident
 */
export function logSecurityEvent(eventType: string, details: Record<string, any>) {
  // Import logger here to avoid circular dependency
  const { logger } = require('./logger')
  
  // ปิด security logs ใน console (ข้อมูลยังถูกบันทึกใน database อยู่)
  // logger.security(eventType, details)
  
  // Record to database (async, don't await to avoid blocking)
  const { createSecurityIncident } = require('./security-incident')
  const { IncidentType, IncidentSeverity } = require('@prisma/client')
  
  // Map event types to IncidentType enum
  const typeMap: Record<string, any> = {
    'FAILED_LOGIN': IncidentType.FAILED_LOGIN,
    'ACCOUNT_LOCKED': IncidentType.ACCOUNT_LOCKED,
    'ACCOUNT_UNLOCKED': IncidentType.ACCOUNT_UNLOCKED,
    'ACCOUNT_AUTO_LOCKED': IncidentType.ACCOUNT_AUTO_LOCKED,
    'LOGIN_ATTEMPT_LOCKED_ACCOUNT': IncidentType.LOGIN_ATTEMPT_LOCKED_ACCOUNT,
    'LOGIN_RATE_LIMIT_EXCEEDED': IncidentType.LOGIN_RATE_LIMIT_EXCEEDED,
    'LOGIN_SUCCESS': IncidentType.LOGIN_SUCCESS,
    'SECURITY_BREACH': IncidentType.SECURITY_BREACH,
    'UNAUTHORIZED_ACCESS': IncidentType.UNAUTHORIZED_ACCESS,
    'SUSPICIOUS_ACTIVITY': IncidentType.SUSPICIOUS_ACTIVITY,
  }
  
  // Determine severity based on event type
  const severityMap: Record<string, any> = {
    'FAILED_LOGIN': IncidentSeverity.LOW,
    'ACCOUNT_LOCKED': IncidentSeverity.MEDIUM,
    'ACCOUNT_AUTO_LOCKED': IncidentSeverity.MEDIUM,
    'LOGIN_ATTEMPT_LOCKED_ACCOUNT': IncidentSeverity.MEDIUM,
    'LOGIN_RATE_LIMIT_EXCEEDED': IncidentSeverity.HIGH,
    'SECURITY_BREACH': IncidentSeverity.CRITICAL,
    'UNAUTHORIZED_ACCESS': IncidentSeverity.HIGH,
    'SUSPICIOUS_ACTIVITY': IncidentSeverity.MEDIUM,
  }
  
  const incidentType = typeMap[eventType] || IncidentType.SUSPICIOUS_ACTIVITY
  const severity = severityMap[eventType] || IncidentSeverity.MEDIUM
  
  // Create incident asynchronously (don't block)
  createSecurityIncident({
    type: incidentType,
    severity,
    description: `Security Event: ${eventType}`,
    metadata: details,
    userId: details.userId,
    username: details.username || details.identifier,
    ipAddress: details.ip || details.ipAddress,
    userAgent: details.userAgent,
  }).catch((error: Error) => {
    // Silently fail - we don't want security logging to break the app
    logger.error('Failed to create security incident', { error: error.message })
  })
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request | null): string {
  if (!request) return 'unknown'
  
  // Check various headers for IP (behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

/**
 * Check if password has been compromised (basic check)
 */
export function isPasswordCompromised(password: string): boolean {
  // Common weak passwords
  const weakPasswords = [
    'password', 'password123', '123456', '12345678', 'qwerty',
    'abc123', 'admin', 'admin123', 'letmein', 'welcome',
  ]
  
  return weakPasswords.includes(password.toLowerCase())
}

/**
 * Generate secure random token for password reset
 */
export function generateSecureToken(): string {
  // In production, use crypto.randomBytes
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
