'use client'

import { useEffect } from 'react'

interface AlertDialogProps {
  isOpen: boolean
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  buttonText?: string
  onClose: () => void
}

export default function AlertDialog({
  isOpen,
  title,
  message,
  type = 'info',
  buttonText = 'ตกลง',
  onClose,
}: AlertDialogProps) {
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

  const typeConfig = {
    info: {
      icon: 'ℹ️',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      titleColor: 'text-blue-900',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
    success: {
      icon: '✅',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      titleColor: 'text-green-900',
      buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    },
    warning: {
      icon: '⚠️',
      bgColor: 'from-yellow-50 to-yellow-100',
      borderColor: 'border-yellow-200',
      titleColor: 'text-yellow-900',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    },
    error: {
      icon: '❌',
      bgColor: 'from-red-50 to-red-100',
      borderColor: 'border-red-200',
      titleColor: 'text-red-900',
      buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
  }

  const config = typeConfig[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - เบากว่า */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog - เล็กลงและมี animation */}
      <div className={`relative w-full max-w-sm transform overflow-hidden rounded-lg bg-white shadow-2xl transition-all animate-in fade-in zoom-in duration-200 border ${config.borderColor}`}>
        {/* Body */}
        <div className={`px-5 py-4 bg-gradient-to-br ${config.bgColor}`}>
          <div className="flex items-start gap-3 mb-3">
            <span className="text-xl">{config.icon}</span>
            <div className="flex-1">
              <h3 className={`text-base font-semibold ${config.titleColor} mb-1`}>{title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
            </div>
          </div>
          
          {/* Button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${config.buttonColor}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

