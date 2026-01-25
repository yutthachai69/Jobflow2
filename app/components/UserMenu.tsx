'use client'

import { useState, useRef, useEffect } from 'react'
import { logout } from '@/app/actions'
import ConfirmDialog from './ConfirmDialog'

interface UserMenuProps {
  username?: string
  fullName?: string | null
  role: 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
  siteName?: string | null
}

export default function UserMenu({ username, fullName, role, siteName }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setShowLogoutConfirm(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const roleLabels: Record<string, string> = {
    ADMIN: 'ผู้ดูแลระบบ',
    TECHNICIAN: 'ช่าง',
    CLIENT: 'ลูกค้า',
  }

  const displayName = fullName || username || 'ผู้ใช้'
  const displayRole = roleLabels[role] || role

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    setIsOpen(false)
    await logout()
  }

  return (
    <>
      <div className="relative z-50" ref={menuRef}>
        {/* User Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-app-card hover:bg-app-card/80 border border-app transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:ring-offset-2 focus:ring-offset-[var(--app-section)]"
          aria-label="เมนูผู้ใช้"
          aria-expanded={isOpen}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[var(--app-btn-primary)] flex items-center justify-center text-[var(--app-btn-primary-text)] font-semibold text-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
          
          {/* User Info (hidden on mobile) */}
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-app-heading leading-tight">
              {displayName}
            </div>
            <div className="text-xs text-app-muted leading-tight">
              {displayRole}
            </div>
          </div>

          {/* Dropdown Icon */}
          <svg
            className={`w-4 h-4 text-app-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className="absolute right-0 top-full mt-1 w-72 bg-app-card rounded-xl shadow-2xl border border-app overflow-hidden"
            style={{
              animation: 'slideDown 0.15s ease-out',
            }}
          >
            {/* User Info Header */}
            <div className="px-5 py-4 border-b border-app bg-app-section/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--app-btn-primary)] flex items-center justify-center text-[var(--app-btn-primary-text)] font-bold text-base shadow-lg flex-shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-app-heading truncate leading-tight">{displayName}</div>
                  <div className="text-xs text-app-muted truncate mt-0.5">{displayRole}</div>
                  {siteName && (
                    <div className="text-xs text-app-muted truncate mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {siteName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // TODO: Navigate to profile page if exists
                }}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-app-body hover:bg-app-section transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-app-section group-hover:bg-app-card flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span>โปรไฟล์ของฉัน</span>
              </button>

              <div className="mx-4 my-2 border-t border-app"></div>

              <button
                onClick={() => {
                  setShowLogoutConfirm(true)
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="ต้องการออกจากระบบ"
        message="คุณต้องการออกจากระบบจริงหรือไม่? คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อใช้งานต่อ"
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        confirmColor="red"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  )
}
