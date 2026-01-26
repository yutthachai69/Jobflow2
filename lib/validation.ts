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

// Validate password strength with complexity requirements
export function validatePassword(password: string): { valid: boolean; error?: string; strength?: 'weak' | 'medium' | 'strong' } {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Password is required' }
  }
  
  // Minimum length: 8 characters (increased from 6)
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' }
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '12345678', '123456789', 'qwerty',
    'abc123', 'admin', 'admin123', 'letmein', 'welcome',
    '123456', 'password1', 'root', 'toor', 'pass'
  ]
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, error: 'Password is too common. Please choose a stronger password.' }
  }

  // Password complexity requirements
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  // Count complexity requirements met
  let complexityScore = 0
  if (hasUpperCase) complexityScore++
  if (hasLowerCase) complexityScore++
  if (hasNumbers) complexityScore++
  if (hasSpecialChar) complexityScore++
  if (password.length >= 12) complexityScore++

  // Require at least 3 out of 4 character types (upper, lower, number, special)
  if (complexityScore < 3) {
    return { 
      valid: false, 
      error: 'Password must contain at least 3 of the following: uppercase letters, lowercase letters, numbers, special characters' 
    }
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (complexityScore >= 4 && password.length >= 12) {
    strength = 'strong'
  } else if (complexityScore >= 3) {
    strength = 'medium'
  }
  
  return { valid: true, strength }
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




