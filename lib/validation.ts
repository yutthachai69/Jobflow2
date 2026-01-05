/**
 * Input validation and sanitization utilities
 */

// Sanitize string input (remove dangerous characters)
export function sanitizeString(input: string | null | undefined): string | null {
  if (!input) return null
  
  // Remove null bytes and trim
  let sanitized = input.replace(/\0/g, '').trim()
  
  // Limit length (prevent DoS)
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000)
  }
  
  return sanitized || null
}

// Validate username
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Username is required' }
  }
  
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }
  
  if (username.length > 50) {
    return { valid: false, error: 'Username must be less than 50 characters' }
  }
  
  // Only allow alphanumeric, underscore, and hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscore, and hyphen' }
  }
  
  return { valid: true }
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Password is required' }
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' }
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' }
  }
  
  return { valid: true }
}

// Validate email (if needed in future)
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  
  return { valid: true }
}

// Sanitize and validate numeric input
export function sanitizeNumber(input: string | null | undefined, min?: number, max?: number): number | null {
  if (!input) return null
  
  const num = parseInt(input, 10)
  if (isNaN(num)) return null
  
  if (min !== undefined && num < min) return null
  if (max !== undefined && num > max) return null
  
  return num
}

// Sanitize date input
export function sanitizeDate(input: string | null | undefined): Date | null {
  if (!input) return null
  
  const date = new Date(input)
  if (isNaN(date.getTime())) return null
  
  return date
}


