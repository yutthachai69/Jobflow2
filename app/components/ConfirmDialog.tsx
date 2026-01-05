'use client'

import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'red' | 'blue' | 'green' | 'orange'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  confirmColor = 'red',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const confirmColorClasses = {
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - เบากว่า */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Dialog - เล็กลงและมี animation */}
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-lg bg-white shadow-2xl transition-all animate-in fade-in zoom-in duration-200">
        {/* Body */}
        <div className="px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{message}</p>
          
          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmColorClasses[confirmColor]}`}
            >
              {isLoading ? 'กำลังดำเนินการ...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

