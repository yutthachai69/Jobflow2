'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface NotificationBellProps {
  initialCount: number
  href?: string
}

export default function NotificationBell({ initialCount, href = '/messages' }: NotificationBellProps) {
  const [count, setCount] = useState(initialCount)
  const pathname = usePathname()

  // Update count when navigating to notification page
  useEffect(() => {
    if (pathname === href) {
      setTimeout(() => setCount(0), 0)
    } else {
      setTimeout(() => setCount(initialCount), 0)
    }
  }, [pathname, initialCount, href])

  const isActive = pathname === href

  const baseClass = `relative inline-flex items-center justify-center p-2 rounded-lg transition-colors ${isActive
      ? 'bg-[var(--app-btn-primary)] text-[var(--app-btn-primary-text)]'
      : 'text-app-body hover:text-app-heading hover:bg-app-card'
    }`

  const title = href === '/messages' ? 'กล่องข้อความ' : 'การแจ้งเตือน'
  const ariaLabel = count > 0
    ? `${title} (${count} ${href === '/messages' ? 'ข้อความใหม่' : 'การแจ้งเตือนใหม่'})`
    : title

  return (
    <Link
      href={href}
      className={baseClass}
      title={title}
      aria-label={ariaLabel}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white rounded-full min-w-[18px] h-[18px] bg-red-500">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
