'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNavLinks() {
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
      <Link href="/" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${linkClass(isActive("/") && pathname === "/")}`} aria-label="Dashboard">Dashboard</Link>
      <Link href="/work-orders" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${linkClass(isActive("/work-orders"))}`} aria-label="ใบสั่งงาน">ใบสั่งงาน</Link>
      <Link href="/assets" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${linkClass(isActive("/assets"))}`} aria-label="ทรัพย์สินและอุปกรณ์">ทรัพย์สินและอุปกรณ์</Link>
      <Link href="/users" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${linkClass(isActive("/users"))}`} aria-label="ผู้ใช้งาน">ผู้ใช้งาน</Link>
      <Link href="/locations" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${linkClass(isActive("/locations"))}`} aria-label="สถานที่">สถานที่</Link>
      <Link href="/security-incidents" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${linkClass(isActive("/security-incidents"))}`} aria-label="เหตุการณ์ด้านความปลอดภัย">ความปลอดภัย</Link>
      <Link href="/contact" className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${linkClass(isActive("/contact"))}`} aria-label="ติดต่อเรา">ติดต่อเรา</Link>
    </>
  )
}

