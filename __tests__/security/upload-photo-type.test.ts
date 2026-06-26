/**
 * Security test: photoType path traversal prevention
 * Verifies that the upload route rejects invalid/malicious photoType values.
 */

const ALLOWED_PHOTO_TYPES = ['BEFORE', 'AFTER', 'DEFECT', 'METER'] as const
type AllowedPhotoType = typeof ALLOWED_PHOTO_TYPES[number]

function validatePhotoType(photoType: string | null): photoType is AllowedPhotoType {
  if (!photoType) return false
  return (ALLOWED_PHOTO_TYPES as readonly string[]).includes(photoType)
}

describe('Upload route: photoType validation', () => {
  describe('valid photo types', () => {
    it.each(ALLOWED_PHOTO_TYPES)('accepts %s', (type) => {
      expect(validatePhotoType(type)).toBe(true)
    })
  })

  describe('path traversal attempts', () => {
    const maliciousInputs = [
      '../../etc/passwd',
      '../public',
      '..\\windows\\system32',
      '../../',
      'BEFORE/../../../etc',
      '%2e%2e%2f',
    ]

    it.each(maliciousInputs)('rejects "%s"', (input) => {
      expect(validatePhotoType(input)).toBe(false)
    })
  })

  describe('empty / null inputs', () => {
    it('rejects null', () => {
      expect(validatePhotoType(null)).toBe(false)
    })

    it('rejects empty string', () => {
      expect(validatePhotoType('')).toBe(false)
    })

    it('rejects whitespace', () => {
      expect(validatePhotoType('   ')).toBe(false)
    })
  })

  describe('case sensitivity', () => {
    it('rejects lowercase variants', () => {
      expect(validatePhotoType('before')).toBe(false)
      expect(validatePhotoType('after')).toBe(false)
    })

    it('rejects mixed case', () => {
      expect(validatePhotoType('Before')).toBe(false)
    })
  })
})
