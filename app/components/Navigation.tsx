'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/index'
import AdminNavLinks from './navigation/AdminNavLinks'
import TechnicianNavLinks from './navigation/TechnicianNavLinks'
import ClientNavLinks from './navigation/ClientNavLinks'
import NotificationBell from './navigation/NotificationBell'

type NavRole = 'ADMIN' | 'TECHNICIAN' | 'CLIENT'

interface NavigationProps {
  initialUser?: { role: NavRole } | null
}

export default function Navigation({ initialUser = null }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const pathname = usePathname()
  const role = initialUser?.role ?? null

  useEffect(() => {
    if (role !== 'ADMIN') return
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
  }, [role])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  if (pathname === '/welcome') {
    return null
  }

  if (!role) {
    return null
  }

  return (
    <nav className="bg-app-section border-b border-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Links */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2" aria-label="กลับหน้าแรก">
                <img
                  src="/flomac.png"
                  alt="Flomac"
                  width={120}
                  height={36}
                  className="h-9 w-auto object-contain"
                />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
              {role === 'ADMIN' && <AdminNavLinks />}
              {role === 'TECHNICIAN' && <TechnicianNavLinks />}
              {role === 'CLIENT' && <ClientNavLinks />}
            </div>
          </div>

          {/* Right side - Notification Bell (Admin only) and User Menu */}
          <div className="flex items-center gap-4">
            {role === 'ADMIN' && (
              <NotificationBell initialCount={unreadMessageCount} />
            )}
            <div className="hidden sm:block">
              <form action={logout}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-app-body hover:text-app-heading transition-colors"
                  aria-label="ออกจากระบบ"
                >
                  ออกจากระบบ
                </button>
              </form>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-app-muted hover:text-app-body hover:bg-app-card focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--app-btn-primary)]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="เปิดเมนู"
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-app">
          <div className="pt-2 pb-3 space-y-1">
            {role === 'ADMIN' && <AdminNavLinks />}
            {role === 'TECHNICIAN' && <TechnicianNavLinks />}
            {role === 'CLIENT' && <ClientNavLinks />}
          </div>
          <div className="pt-4 pb-3 border-t border-app">
            <form action={logout}>
              <button
                type="submit"
                className="block w-full text-left px-4 py-2 text-base font-medium text-app-body hover:text-app-heading hover:bg-app-card transition-colors"
                aria-label="ออกจากระบบ"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}
