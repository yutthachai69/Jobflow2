'use client'

import { useState, useRef, useEffect } from 'react'
import { logout } from '@/app/actions/index'
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
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside (support both mouse and touch)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Support both mouse and touch events for mobile
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [isOpen])

  // Calculate dropdown position when opened (responsive)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const isMobile = window.innerWidth < 640 // sm breakpoint
      const dropdownWidth = isMobile ? Math.min(window.innerWidth - 32, 288) : 288 // w-72 = 18rem = 288px, on mobile use viewport width - padding
      const viewportWidth = window.innerWidth
      const spaceOnRight = viewportWidth - buttonRect.right
      const spaceOnLeft = buttonRect.left

      // วาง dropdown ให้อยู่ใต้ปุ่ม โดยยึดขอบขวาของปุ่ม
      // ถ้าพื้นที่ด้านขวาไม่พอ ให้วางให้ขอบขวาของ dropdown อยู่ที่ขอบขวาของ viewport
      if (spaceOnRight < dropdownWidth) {
        // ไม่พอที่ ให้วางให้ขอบขวาชิดขอบจอ (แต่มี padding 16px)
        setDropdownPosition({
          top: buttonRect.bottom + 8,
          right: isMobile ? 16 : 0,
        })
      } else {
        // พอที่ ให้วางให้ขอบขวาของ dropdown ตรงกับขอบขวาของปุ่ม
        setDropdownPosition({
          top: buttonRect.bottom + 8,
          right: viewportWidth - buttonRect.right,
        })
      }
    } else {
      setDropdownPosition(null)
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
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 sm:gap-3 pl-1.5 pr-3 sm:pl-2 sm:pr-4 py-1.5 sm:py-2 rounded-full bg-app-card hover:bg-app-card/80 border border-app shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:ring-offset-2 focus:ring-offset-[var(--app-section)] touch-manipulation group"
          aria-label="เมนูผู้ใช้"
          aria-expanded={isOpen}
        >
          {/* Avatar (with gradient & glow) */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#92761a] to-[#c2a66a] blur-[3px] opacity-40 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#c2a66a] to-[#92761a] border border-white/20 flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0 shadow-inner">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* User Info (hidden on mobile) */}
          <div className="hidden md:flex flex-col text-left min-w-0 mr-1 sm:mr-2">
            <div className="text-sm font-semibold text-app-heading leading-tight truncate">
              {displayName}
            </div>
            <div className="text-[11px] font-medium text-[#c2a66a] leading-tight truncate mt-0.5 tracking-wide uppercase">
              {displayRole}
            </div>
          </div>

          {/* Dropdown Icon */}
          <div className="w-5 h-5 rounded-full bg-app-section flex items-center justify-center group-hover:bg-[#c2a66a]/10 transition-colors">
            <svg
              className={`w-3.5 h-3.5 text-app-muted group-hover:text-[#c2a66a] transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && dropdownPosition && (
          <div
            className="fixed w-[calc(100vw-2rem)] max-w-72 sm:w-72 bg-app-card rounded-xl shadow-2xl border border-app overflow-hidden z-[100] origin-top-right"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
              animation: 'slideDown 0.15s ease-out',
            }}
          >
            {/* User Info Header */}
            <div className="px-4 sm:px-5 py-4 sm:py-5 border-b border-app bg-app-section/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#c2a66a]/10 to-transparent pointer-events-none"></div>
              <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#c2a66a] to-[#92761a] border-2 border-white/20 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-[0_4px_12px_rgba(194,166,106,0.3)] flex-shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base font-bold text-app-heading truncate leading-tight">{displayName}</div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#c2a66a]/15 text-[#c2a66a] mt-1.5 border border-[#c2a66a]/30">
                    {displayRole}
                  </div>
                  {siteName && (
                    <div className="text-xs text-app-muted truncate mt-1.5 flex items-center gap-1.5 bg-black/20 dark:bg-white/5 px-2 py-1 rounded-md w-fit border border-app">
                      <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#c2a66a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate font-medium">{siteName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2.5 flex flex-col gap-1 px-2">

              <button
                onClick={() => {
                  setShowLogoutConfirm(true)
                  setIsOpen(false)
                }}
                className="w-full relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-app-body hover:bg-gradient-to-r hover:from-red-500/10 hover:to-transparent active:bg-red-500/20 transition-all duration-300 group touch-manipulation overflow-hidden border border-transparent hover:border-red-500/10"
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0 w-1 bg-gradient-to-b from-red-500 to-red-600 rounded-r-full group-hover:h-3/4 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                <div className="w-10 h-10 rounded-[10px] bg-red-500/5 group-hover:bg-red-500/10 border border-transparent group-hover:border-red-500/20 flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-[0_0_12px_rgba(239,68,68,0.2)] flex-shrink-0 relative">
                  <div className="absolute inset-0 rounded-[10px] bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <svg className="w-5 h-5 text-red-500/70 group-hover:text-red-500 transition-colors duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-bold text-red-500/90 group-hover:text-red-500 transition-colors duration-300 text-[13px] leading-tight">ออกจากระบบ</span>
                  <span className="text-[10px] text-red-500/50 font-medium mt-0.5 group-hover:text-red-500/70 transition-colors truncate w-full">ยุติการใช้งานและออกจากระบบ</span>
                </div>
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
