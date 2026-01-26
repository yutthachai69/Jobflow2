'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateContactInfo } from '@/app/actions/index'
import Link from 'next/link'

interface ContactInfo {
  id: string
  email: string
  phone: string
  hours: string
}

interface Props {
  contactInfo: ContactInfo
}

export default function AdminContactInfo({ contactInfo }: Props) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: contactInfo.email,
    phone: contactInfo.phone,
    hours: contactInfo.hours,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccess(false)
    const newErrors: Record<string, string> = {}

    // Validation
    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = 'กรุณากรอกอีเมล'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    }
    
    if (!formData.phone || formData.phone.trim() === '') {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์'
    }
    
    if (!formData.hours || formData.hours.trim() === '') {
      newErrors.hours = 'กรุณากรอกเวลาทำการ'
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
      submitFormData.append('contactInfoId', contactInfo.id)
      submitFormData.append('email', formData.email.trim())
      submitFormData.append('phone', formData.phone.trim())
      submitFormData.append('hours', formData.hours.trim())

      await updateContactInfo(submitFormData)
      setSuccess(true)
      setIsSubmitting(false)
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
      
      // Refresh to show updated data
      router.refresh()
    } catch (error: any) {
      setErrors({ submit: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' })
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-gray-200">
      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <span>บันทึกข้อมูลสำเร็จแล้ว</span>
          </p>
        </div>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Email */}
        <div data-error={errors.email ? 'true' : undefined}>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            อีเมล <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400`}
            placeholder="support@airservice.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div data-error={errors.phone ? 'true' : undefined}>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
            เบอร์โทรศัพท์ <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400`}
            placeholder="02-XXX-XXXX"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* Hours */}
        <div data-error={errors.hours ? 'true' : undefined}>
          <label htmlFor="hours" className="block text-sm font-semibold text-gray-700 mb-2">
            เวลาทำการ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="hours"
            name="hours"
            value={formData.hours}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.hours ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400`}
            placeholder="จันทร์-ศุกร์ 08:00-17:00 น."
          />
          {errors.hours && (
            <p className="mt-1 text-sm text-red-600">{errors.hours}</p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-1">ข้อมูลนี้จะแสดงให้ลูกค้าและช่างเห็น</p>
              <p className="text-gray-600">คุณสามารถแก้ไขข้อมูลนี้ได้ตลอดเวลา</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
          <Link
            href="/"
            className="flex-1 sm:flex-none px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-medium text-center transition-all duration-200 text-gray-700"
          >
            ยกเลิก
          </Link>
        </div>
      </div>
    </form>
  )
}

