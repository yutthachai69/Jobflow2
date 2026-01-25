'use client'

import { useEffect, useRef } from 'react'

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
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Focus cancel button by default
      cancelButtonRef.current?.focus()
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter' && !isLoading) {
        // Enter key triggers confirm
        onConfirm()
      } else if (e.key === 'Tab') {
        // Trap focus within dialog
        const focusableElements = [cancelButtonRef.current, confirmButtonRef.current].filter(Boolean) as HTMLButtonElement[]
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel, onConfirm, isLoading])

  if (!isOpen) return null

  const confirmColorClasses = {
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" onClick={onCancel} />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-app-card border border-app shadow-2xl transition-all animate-in fade-in zoom-in duration-200 pointer-events-auto">
        {/* Icon + Title */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: confirmColor === 'red' ? 'rgba(154, 90, 90, 0.15)' : confirmColor === 'blue' ? 'rgba(91, 124, 153, 0.15)' : 'rgba(194, 166, 106, 0.15)' }}>
            {confirmColor === 'red' ? (
              <svg className="w-8 h-8" style={{ color: '#9A5A5A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" style={{ color: confirmColor === 'blue' ? '#5B7C99' : '#C2A66A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-app-heading mb-3">{title}</h3>
          <p className="text-sm text-app-body leading-relaxed">{message}</p>
        </div>
        
        {/* Buttons */}
        <div className="px-8 pb-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={isLoading}
            aria-label={cancelText}
            className="px-6 py-2.5 text-sm font-semibold text-app-body bg-app-section hover:bg-app-section/80 rounded-lg border border-app focus:outline-none focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:ring-offset-2 focus:ring-offset-[var(--app-card)] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={isLoading}
            aria-label={confirmText}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--app-card)] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmColor === 'red'
                ? 'bg-[#9A5A5A] hover:bg-[#8a4f4f] text-white focus:ring-[#9A5A5A] shadow-lg shadow-red-500/20'
                : confirmColor === 'blue'
                ? 'bg-[#5B7C99] hover:bg-[#4d6a85] text-white focus:ring-[#5B7C99] shadow-lg shadow-blue-500/20'
                : 'btn-app-primary focus:ring-[var(--app-btn-primary)] shadow-lg'
            }`}
          >
            {isLoading ? 'กำลังดำเนินการ...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

