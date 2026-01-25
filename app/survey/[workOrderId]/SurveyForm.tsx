'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitFeedback } from '@/app/actions/feedback'

interface Props {
  workOrderId: string
}

export default function SurveyForm({ workOrderId }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError('กรุณาให้คะแนนความพึงพอใจ')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('workOrderId', workOrderId)
      formData.append('rating', rating.toString())
      formData.append('comment', comment)

      await submitFeedback(formData)
      router.refresh()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งแบบสำรวจ')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-app-heading mb-3">
          ให้คะแนนความพึงพอใจ <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-4xl transition-transform hover:scale-110 ${
                rating >= star
                  ? 'text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
              aria-label={`ให้ ${star} ดาว`}
            >
              ★
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-2 text-sm text-app-muted">
            {rating === 1 && 'ไม่พอใจ'}
            {rating === 2 && 'พอใจน้อย'}
            {rating === 3 && 'พอใจปานกลาง'}
            {rating === 4 && 'พอใจมาก'}
            {rating === 5 && 'พอใจมากที่สุด'}
          </p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-app-heading mb-2">
          ความคิดเห็นเพิ่มเติม (ไม่บังคับ)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-app-border rounded-lg bg-app-bg text-app-body focus:outline-none focus:ring-2 focus:ring-[var(--app-btn-primary)]"
          placeholder="กรุณาแจ้งความคิดเห็นหรือข้อเสนอแนะ..."
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="flex-1 px-6 py-3 bg-[var(--app-btn-primary)] text-[var(--app-btn-primary-text)] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'กำลังส่ง...' : 'ส่งแบบสำรวจ'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-app-card border border-app-border rounded-lg font-medium text-app-body hover:bg-app-section transition-colors"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  )
}
