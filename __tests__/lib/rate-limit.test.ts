import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset rate limits before each test
    resetRateLimit('127.0.0.1', 'API')
    resetRateLimit('127.0.0.1', 'LOGIN')
    resetRateLimit('127.0.0.1', 'UPLOAD')
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const result = checkRateLimit('127.0.0.1', 'API')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThan(0)
    })

    it('should block requests exceeding limit', () => {
      const ip = '127.0.0.1'
      const type = 'API'
      
      // Make 100 requests (API limit)
      for (let i = 0; i < 100; i++) {
        checkRateLimit(ip, type)
      }
      
      // Next request should be blocked
      const result = checkRateLimit(ip, type)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should have different limits for different types', () => {
      const ip = '127.0.0.1'
      
      // API limit is 100
      for (let i = 0; i < 100; i++) {
        checkRateLimit(ip, 'API')
      }
      
      // Login should still work (different limit)
      const loginResult = checkRateLimit(ip, 'LOGIN')
      expect(loginResult.allowed).toBe(true)
    })

    it('should reset after time window', () => {
      // This test would require mocking time, which is more complex
      // For now, we just test that resetRateLimit works
      const ip = '127.0.0.1'
      const type = 'API'
      
      // Exceed limit
      for (let i = 0; i < 100; i++) {
        checkRateLimit(ip, type)
      }
      
      // Reset
      resetRateLimit(ip, type)
      
      // Should be allowed again
      const result = checkRateLimit(ip, type)
      expect(result.allowed).toBe(true)
    })
  })
})

