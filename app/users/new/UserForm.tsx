'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser } from '@/app/actions'
import Link from 'next/link'
import Tooltip from '@/app/components/Tooltip'

interface Site {
  id: string
  name: string
  client: {
    name: string
  }
}

interface Props {
  sites: Site[]
}

export default function UserForm({ sites }: Props) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'TECHNICIAN' | 'CLIENT'>('TECHNICIAN')
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}

    const formData = new FormData(e.currentTarget)
    const username = (formData.get('username') as string)?.trim() || ''
    const password = formData.get('password') as string
    const fullName = (formData.get('fullName') as string)?.trim() || null

    // Validation
    if (!username) {
      newErrors.username = 'กรุณากรอกชื่อผู้ใช้'
    } else if (username.length < 3) {
      newErrors.username = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'
    } else if (username.length > 50) {
      newErrors.username = 'ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      newErrors.username = 'ชื่อผู้ใช้สามารถใช้ได้เฉพาะตัวอักษร ตัวเลข _ และ -'
    }

    if (!password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน'
    } else if (password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    } else if (password.length > 128) {
      newErrors.password = 'รหัสผ่านต้องไม่เกิน 128 ตัวอักษร'
    }

    if (selectedRole === 'CLIENT' && !selectedSiteId) {
      newErrors.siteId = 'กรุณาเลือกสถานที่ (สำหรับ CLIENT)'
    }

    if (fullName && fullName.length > 200) {
      newErrors.fullName = 'ชื่อ-นามสกุลต้องไม่เกิน 200 ตัวอักษร'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      const firstErrorField = document.querySelector('[data-error]')
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setErrors({})
    formData.set('role', selectedRole)
    if (selectedRole === 'CLIENT' && selectedSiteId) {
      formData.set('siteId', selectedSiteId)
    }

    try {
      await createUser(formData)
    } catch (err: any) {
      setErrors({ submit: err.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้' })
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border p-8">
      <div className="space-y-6">
        {/* Username */}
        <div data-error={errors.username ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ชื่อผู้ใช้ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="username"
            autoFocus
            aria-label="ชื่อผู้ใช้"
            aria-required="true"
            aria-invalid={errors.username ? 'true' : 'false'}
            aria-describedby={errors.username ? 'username-error' : 'username-help'}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400 ${errors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
              }`}
            placeholder="เช่น tech1, client1"
            onChange={(e) => {
              const value = e.target.value
              if (errors.username) {
                setErrors({ ...errors, username: '' })
              }
              // Real-time validation
              if (value && value.length < 3) {
                setErrors({ ...errors, username: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' })
              } else if (value && value.length > 50) {
                setErrors({ ...errors, username: 'ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร' })
              } else if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
                setErrors({ ...errors, username: 'ชื่อผู้ใช้สามารถใช้ได้เฉพาะตัวอักษร ตัวเลข _ และ -' })
              }
            }}
          />
          {errors.username ? (
            <p id="username-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
              <span>{errors.username}</span>
            </p>
          ) : (
            <p id="username-help" className="mt-2 text-xs text-gray-500">
              ใช้ตัวอักษร ตัวเลข _ และ - ได้เท่านั้น (3-50 ตัวอักษร)
            </p>
          )}
        </div>

        {/* Password */}
        <div data-error={errors.password ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            รหัสผ่าน <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            aria-label="รหัสผ่าน"
            aria-required="true"
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : 'password-help'}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
              }`}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            onChange={(e) => {
              const value = e.target.value
              if (errors.password) {
                setErrors({ ...errors, password: '' })
              }
              // Real-time validation
              if (value && value.length < 6) {
                setErrors({ ...errors, password: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
              } else if (value && value.length > 128) {
                setErrors({ ...errors, password: 'รหัสผ่านต้องไม่เกิน 128 ตัวอักษร' })
              }
            }}
          />
          {errors.password ? (
            <p id="password-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
              <span>{errors.password}</span>
            </p>
          ) : (
            <p id="password-help" className="mt-2 text-xs text-gray-500">
              อย่างน้อย 6 ตัวอักษร (แนะนำให้ใช้ตัวอักษร ตัวเลข และอักขระพิเศษผสมกัน)
            </p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ชื่อ-นามสกุล
          </label>
          <input
            type="text"
            name="fullName"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="เช่น สมชาย งานดี"
          />
        </div>

        {/* LINE User ID */}
        <div data-error={errors.lineUserId ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            LINE User ID (สำหรับแจ้งเตือน)
          </label>
          <input
            type="text"
            name="lineUserId"
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400 font-mono text-sm ${errors.lineUserId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
              }`}
            placeholder="เช่น U1234567890abcdef..."
            onChange={(e) => {
              const value = e.target.value.trim()
              if (value && !value.startsWith('U')) {
                setErrors({ ...errors, lineUserId: 'User ID ต้องขึ้นต้นด้วยตัว U (ไม่ใช่เบอร์โทรศัพท์)' })
              } else {
                const { lineUserId, ...rest } = errors
                setErrors(rest)
              }
            }}
          />
          {errors.lineUserId ? (
            <p className="mt-1 text-sm text-red-600 font-medium">{errors.lineUserId}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              ใส่ User ID ของ LINE เพื่อรับการแจ้งเตือน (ไม่ใช่ LINE ID ทั่วไป หรือ เบอร์โทร)
              <br />* ดูวิธีหา User ID ได้จากคู่มือ
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            บทบาท <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value as 'ADMIN' | 'TECHNICIAN' | 'CLIENT')
              setSelectedSiteId('')
            }}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900"
          >
            <option value="TECHNICIAN">ช่าง</option>
            <option value="CLIENT">ลูกค้า</option>
            <option value="ADMIN">ผู้ดูแลระบบ</option>
          </select>
        </div>

        {/* Site Selection (สำหรับ CLIENT) */}
        {selectedRole === 'CLIENT' && (
          <div data-error={errors.siteId ? 'true' : undefined}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              สถานที่ <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 ${errors.siteId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
                }`}
            >
              <option value="">-- เลือกสถานที่ --</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.client.name})
                </option>
              ))}
            </select>
            {errors.siteId && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>{errors.siteId}</span>
              </p>
            )}
            {!errors.siteId && (
              <p className="mt-2 text-xs text-gray-500">
                สำหรับ CLIENT: ต้องเลือกสถานที่ที่ผู้ใช้จะดูแล
              </p>
            )}
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            aria-label="สร้างผู้ใช้ใหม่"
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
          </button>
          <Link
            href="/users"
            aria-label="ยกเลิกและกลับไปหน้ารายการผู้ใช้"
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            ยกเลิก
          </Link>
        </div>
      </div>
    </form>
  )
}

