import { sanitizeString, validateUsername, validatePassword } from '@/lib/validation'

describe('Validation Utilities', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")')
      expect(sanitizeString('<p>Hello</p>')).toBe('Hello')
    })

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello')
    })

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('')
      expect(sanitizeString('   ')).toBe('')
    })

    it('should handle null and undefined', () => {
      expect(sanitizeString(null as any)).toBe('')
      expect(sanitizeString(undefined as any)).toBe('')
    })
  })

  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      expect(validateUsername('user123')).toBe(true)
      expect(validateUsername('admin_user')).toBe(true)
      expect(validateUsername('user-name')).toBe(true)
    })

    it('should reject invalid usernames', () => {
      expect(validateUsername('ab')).toBe(false) // too short
      expect(validateUsername('a'.repeat(51))).toBe(false) // too long
      expect(validateUsername('user@name')).toBe(false) // invalid character
      expect(validateUsername('user name')).toBe(false) // space
    })
  })

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('password123')).toBe(true)
      expect(validatePassword('P@ssw0rd!')).toBe(true)
      expect(validatePassword('a'.repeat(8))).toBe(true) // min length
    })

    it('should reject invalid passwords', () => {
      expect(validatePassword('short')).toBe(false) // too short
      expect(validatePassword('a'.repeat(101))).toBe(false) // too long
    })
  })
})

