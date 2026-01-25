'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ClientNavLinks() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(path)
  }

  const linkClass = (active: boolean) =>
    active
      ? "bg-[var(--app-btn-primary)] text-[var(--app-btn-primary-text)] font-semibold"
      : "text-app-body hover:text-app-heading hover:bg-app-card"

  return (
    <>
      <Link href="/" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:ring-offset-2 focus:ring-offset-[var(--app-section)] ${linkClass(isActive("/") && pathname === "/")}`} aria-label="Dashboard">Dashboard</Link>
      <Link href="/assets" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:ring-offset-2 focus:ring-offset-[var(--app-section)] ${linkClass(isActive("/assets"))}`} aria-label="ทรัพย์สินและอุปกรณ์">ทรัพย์สินและอุปกรณ์</Link>
      <Link href="/work-orders" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:ring-offset-2 focus:ring-offset-[var(--app-section)] ${linkClass(isActive("/work-orders"))}`} aria-label="ประวัติงาน">ประวัติงาน</Link>
      <Link href="/contact" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:ring-offset-2 focus:ring-offset-[var(--app-section)] ${linkClass(isActive("/contact"))}`} aria-label="ติดต่อเรา">ติดต่อเรา</Link>
    </>
  )
}

