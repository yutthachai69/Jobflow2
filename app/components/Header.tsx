'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserMenu from './UserMenu'
import NotificationBell from './navigation/NotificationBell'
import ThemeToggle from './ThemeToggle'

type NavRole = 'ADMIN' | 'TECHNICIAN' | 'CLIENT'

interface HeaderProps {
  role: NavRole
  username?: string
  fullName?: string | null
  siteName?: string | null
  onMenuToggle?: () => void
}

export default function Header({ role, username, fullName, siteName, onMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  // ไม่แสดง Header บนหน้า welcome/login
  if (pathname === '/welcome' || pathname === '/login') {
    return null
  }

  useEffect(() => {
    if (role === 'ADMIN') {
      const fetchUnread = async () => {
        try {
          const res = await fetch('/api/me', { credentials: 'include', cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            setUnreadMessageCount(data.unreadMessageCount ?? 0)
          }
        } catch {
          // ignore
        }
      }
      fetchUnread()
      const interval = setInterval(fetchUnread, 30000)
      return () => clearInterval(interval)
    } else if (role === 'CLIENT') {
      const fetchUnread = async () => {
        try {
          const res = await fetch('/api/notifications', { credentials: 'include', cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            setUnreadNotificationCount(data.unreadCount ?? 0)
          }
        } catch {
          // ignore
        }
      }
      fetchUnread()
      const interval = setInterval(fetchUnread, 30000)
      return () => clearInterval(interval)
    }
  }, [role])

  return (
    <header className="sticky top-0 z-40 bg-app-section border-b border-app h-16 flex items-center justify-between gap-4 px-4 lg:pl-4" style={{ overflow: 'visible' }}>
      {/* Left: Mobile menu + Logo (mobile) + Location (CLIENT) */}
      <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-initial">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden flex-shrink-0 p-2 rounded-lg bg-app-card border border-app text-app-body hover:bg-app-section transition-all"
            aria-label="เปิดเมนู"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <Link href="/" className="lg:hidden flex items-center gap-2 flex-shrink-0 group">
          <img
            src="/L.M.T.png"
            alt="LMT air service"
            width={120}
            height={36}
            className="h-10 w-auto object-contain drop-shadow-sm"
          />
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 bg-clip-text text-transparent tracking-tight">
            LMT air service
          </span>
        </Link>

        {/* สถานที่ - แสดงตาม role ที่ login */}
        {siteName && (
          <span className="hidden md:block text-lg font-bold text-app-heading truncate min-w-0 tracking-tight">
            {siteName}
          </span>
        )}

        {/* Mobile: สถานที่ */}
        {siteName && (
          <span className="md:hidden text-base font-bold text-app-heading truncate max-w-[150px]">
            {siteName}
          </span>
        )}
      </div>

      {/* Right: Theme toggle + Notification + User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 ml-auto relative z-50 flex-shrink-0">
        <ThemeToggle />
        {(role === 'ADMIN' || role === 'CLIENT') && (
          <div className="hidden sm:block">
            <NotificationBell
              initialCount={role === 'ADMIN' ? unreadMessageCount : unreadNotificationCount}
              href={role === 'ADMIN' ? '/messages' : '/notifications'}
            />
          </div>
        )}

        <UserMenu
          username={username}
          fullName={fullName}
          role={role}
          siteName={siteName}
        />
      </div>
    </header>
  )
}
