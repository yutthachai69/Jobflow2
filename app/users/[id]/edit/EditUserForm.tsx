'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUser } from '@/app/actions'
import Link from 'next/link'

interface Site {
  id: string
  name: string
  client: {
    name: string
  }
}

interface User {
  id: string
  username: string
  fullName: string | null
  role: 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
  siteId: string | null
}

interface Props {
  user: User
  sites: Site[]
}

export default function EditUserForm({ user, sites }: Props) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'TECHNICIAN' | 'CLIENT'>(user.role)
  const [selectedSiteId, setSelectedSiteId] = useState<string>(user.siteId || '')
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
    
    // Password is optional when editing (only validate if provided)
    if (password && password.length > 0) {
      if (password.length < 6) {
        newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
      } else if (password.length > 128) {
        newErrors.password = 'รหัสผ่านต้องไม่เกิน 128 ตัวอักษร'
      }
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

    try {
      const submitFormData = new FormData()
      submitFormData.append('userId', user.id)
      submitFormData.append('username', username)
      if (password && password.length > 0) {
        submitFormData.append('password', password)
      }
      submitFormData.append('fullName', fullName || '')
      submitFormData.append('role', selectedRole)
      submitFormData.append('siteId', selectedRole === 'CLIENT' ? selectedSiteId : '')

      await updateUser(submitFormData)
      router.push('/users')
      router.refresh()
    } catch (error: any) {
      setErrors({ submit: error.message || 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้' })
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
      {/* Username */}
      <div className="mb-6" data-error={errors.username ? true : undefined}>
        <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
          ชื่อผู้ใช้ <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="username"
          name="username"
          defaultValue={user.username}
          className={`w-full px-4 py-3 rounded-lg border ${
            errors.username ? 'border-red-500' : 'border-gray-300'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400`}
          placeholder="กรอกชื่อผู้ใช้"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
        )}
      </div>

      {/* Password (Optional) */}
      <div className="mb-6" data-error={errors.password ? true : undefined}>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
          รหัสผ่าน (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className={`w-full px-4 py-3 rounded-lg border ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400`}
          placeholder="กรอกรหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {/* Full Name */}
      <div className="mb-6" data-error={errors.fullName ? true : undefined}>
        <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
          ชื่อ-นามสกุล
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          defaultValue={user.fullName || ''}
          className={`w-full px-4 py-3 rounded-lg border ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400`}
          placeholder="กรอกชื่อ-นามสกุล"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
        )}
      </div>

      {/* Role */}
      <div className="mb-6" data-error={errors.role ? true : undefined}>
        <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
          บทบาท <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          name="role"
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(e.target.value as 'ADMIN' | 'TECHNICIAN' | 'CLIENT')
            if (e.target.value !== 'CLIENT') {
              setSelectedSiteId('')
            }
          }}
          className={`w-full px-4 py-3 rounded-lg border ${
            errors.role ? 'border-red-500' : 'border-gray-300'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900`}
        >
          <option value="ADMIN">ผู้ดูแลระบบ</option>
          <option value="TECHNICIAN">ช่าง</option>
          <option value="CLIENT">ลูกค้า</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role}</p>
        )}
      </div>

      {/* Site (for CLIENT) */}
      {selectedRole === 'CLIENT' && (
        <div className="mb-6" data-error={errors.siteId ? true : undefined}>
          <label htmlFor="siteId" className="block text-sm font-semibold text-gray-700 mb-2">
            สถานที่ <span className="text-red-500">*</span>
          </label>
          <select
            id="siteId"
            name="siteId"
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.siteId ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900`}
          >
            <option value="">-- เลือกสถานที่ --</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.client.name})
              </option>
            ))}
          </select>
          {errors.siteId && (
            <p className="mt-1 text-sm text-red-600">{errors.siteId}</p>
          )}
        </div>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
        </button>
        <Link
          href="/users"
          className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors text-center"
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  )
}


