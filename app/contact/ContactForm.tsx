'use client'

import { useState } from 'react'
import Link from 'next/link'
import { submitContactMessage } from '@/app/actions/index'

interface ContactFormProps {
  userName: string // fullName หรือ username
  userSite?: {
    name: string
    clientName: string
  } | null
  contactInfo?: {
    email: string
    phone: string
    hours: string
  } | null
}

export default function ContactForm({ userName, userSite, contactInfo }: ContactFormProps) {
  const [formData, setFormData] = useState({
    phone: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}

    // Custom validation
    if (!formData.phone || formData.phone.trim() === '') {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์'
    }
    if (!formData.message || formData.message.trim() === '') {
      newErrors.message = 'กรุณากรอกข้อความ'
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
      const formDataObj = new FormData()
      formDataObj.append('phone', formData.phone)
      formDataObj.append('message', formData.message)

      await submitContactMessage(formDataObj)

      setIsSubmitting(false)
      setSubmitted(true)
      setFormData({ phone: '', message: '' })

      // Reset submitted state after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error) {
      setIsSubmitting(false)
      setErrors({ submit: 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง' })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-app-heading mb-2">ส่งข้อมูลเรียบร้อย!</h2>
        <p className="text-app-muted mb-6">เราจะติดต่อกลับโดยเร็วที่สุด</p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium transition-all"
        >
          กลับไปหน้าแรก
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* แสดงข้อมูลผู้ส่ง (Read-only) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-app-body mb-1">ข้อมูลผู้ส่ง</p>
            <p className="text-app-heading font-medium">{userName}</p>
            {userSite && (
              <p className="text-sm text-app-muted mt-1">
                {userSite.name} ({userSite.clientName})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* เบอร์โทรศัพท์ */}
      <div data-error={errors.phone ? 'true' : undefined}>
        <label className="block text-sm font-semibold text-app-heading mb-2">
          เบอร์โทรศัพท์ <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-app-card text-app-body placeholder:text-gray-400 ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-app'
            }`}
          placeholder="เช่น 081-234-5678"
        />
        {errors.phone && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>{errors.phone}</span>
          </p>
        )}
        {!errors.phone && (
          <p className="mt-2 text-xs text-gray-500">
            เราจะติดต่อกลับที่เบอร์นี้
          </p>
        )}
      </div>

      {/* ข้อความ */}
      <div data-error={errors.message ? 'true' : undefined}>
        <label className="block text-sm font-semibold text-app-heading mb-2">
          ข้อความ <span className="text-red-500">*</span>
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={6}
          className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-app-card resize-none text-app-body placeholder:text-gray-400 ${errors.message ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-app'
            }`}
          placeholder="กรุณาระบุปัญหา สอบถามข้อมูล หรือข้อความที่ต้องการติดต่อ..."
        />
        {errors.message && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>{errors.message}</span>
          </p>
        )}
      </div>

      {/* ข้อมูลการติดต่อเพิ่มเติม */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-sm text-app-body">
            <p className="font-semibold mb-1">ข้อมูลการติดต่อเพิ่มเติม</p>
            <p className="text-app-muted">
              คุณสามารถติดต่อเราผ่านช่องทางอื่นๆ ได้ที่:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-app-muted">
              <li>อีเมล: {contactInfo?.email || 'support@airservice.com'}</li>
              <li>โทรศัพท์: {contactInfo?.phone || '02-XXX-XXXX'}</li>
              <li>เวลาทำการ: {contactInfo?.hours || 'จันทร์-ศุกร์ 08:00-17:00 น.'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ปุ่ม Submit และ Cancel */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <span>{isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อความ'}</span>
        </button>
        <Link
          href="/"
          className="sm:flex-none px-8 py-3 border-2 border-app rounded-xl hover:bg-app-accent hover:border-app-border-glow font-medium text-center transition-all duration-200 text-app-body"
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  )
}
